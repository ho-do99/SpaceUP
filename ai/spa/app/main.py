from __future__ import annotations

import io
import json
import os
import re
from enum import Enum
from functools import lru_cache

import cv2
import numpy as np
import pytesseract
import requests
import torch
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from PIL import Image

from .area_pixels import total_area_pixel_count

app = FastAPI(title="SpaceUP SPA API", version="1.0.0")

MODEL_PATHS = {
    "FP": os.getenv("SPA_FP_MODEL", "/models/SPA_FP_test_model.pth"),
    "CS": os.getenv("SPA_CS_MODEL", "/models/SPA_CS_test_model.pth"),
}


class ResultType(str, Enum):
    colored_image = "colored_image"
    pixel_json = "pixel_json"
    room_colored_image = "room_colored_image"
    room_json = "room_json"


OCR_URL = os.getenv("OCR_URL", "http://ocr:8000/ocr")

ROOM_CLASS_IDS = {
    "침실": 5,
    "안방": 5,
    "거실": 4,
    "주방": 6,
    "욕실": 9,
    "현관": 7,
    "W.I.C": 7,
    "WIC": 7,
    "팬트리": 7,
    "펜트리": 7,
    "드레스룸": 11,
    "파우더룸": 11,
}

ROOM_CLASS_IDS.update({
    "발코니": 8,
    "베란다": 8,
    "다용도실": 101,
    "실외기실": 102,
})
SUPPLEMENTAL_ROOM_IDS = {7, 101, 102}

DISPLAY_COLORS = np.array([
    [46, 204, 113], [52, 152, 219], [155, 89, 182],
    [241, 196, 15], [230, 126, 34], [231, 76, 60],
    [26, 188, 156], [142, 68, 173], [243, 156, 18],
    [22, 160, 133], [41, 128, 185], [192, 57, 43],
    [127, 140, 141], [39, 174, 96], [211, 84, 0],
    [52, 73, 94], [255, 105, 180], [0, 188, 212],
    [124, 179, 66], [255, 112, 67],
], dtype=np.uint8)


@lru_cache(maxsize=2)
def load_model(model_type: str):
    path = MODEL_PATHS[model_type]
    if not os.path.isfile(path):
        raise FileNotFoundError(path)
    loaded = torch.load(path, map_location="cpu")
    loaded.eval()
    return loaded


def prepare_image(content: bytes):
    try:
        original = Image.open(io.BytesIO(content)).convert("RGB")
    except Exception as exc:
        raise HTTPException(400, "Only JPG and PNG images are supported") from exc

    pixels = np.asarray(original)
    height, width = pixels.shape[:2]
    if height > width:
        resized_width, resized_height = 436, 620
        canvas_width, canvas_height = 448, 640
    else:
        resized_width, resized_height = 620, 436
        canvas_width, canvas_height = 640, 448

    cropped = pixels[: height // 32 * 32, : width // 32 * 32]
    if cropped.size == 0:
        raise HTTPException(400, "Image width and height must each be at least 32 pixels")
    resized = cv2.resize(cropped, (resized_width, resized_height), interpolation=cv2.INTER_AREA)
    canvas = np.full((canvas_height, canvas_width, 3), 255, dtype=np.uint8)
    canvas[:resized_height, :resized_width] = resized
    tensor = torch.from_numpy((canvas / 255.0).transpose(2, 0, 1)).float().unsqueeze(0)
    return original, tensor, (resized_width, resized_height)


def room_class(text: str):
    compact = text.replace(" ", "").upper()
    for name, class_id in ROOM_CLASS_IDS.items():
        if name.upper() in compact:
            canonical = "침실" if name == "안방" else name
            return canonical, class_id
    return None


def ocr_room_labels(content: bytes, content_type: str, image_size):
    try:
        response = requests.post(
            OCR_URL,
            files={"file": ("floorplan.png", content, content_type)},
            data={"rotate_clockwise": "false"},
            timeout=90,
        )
        response.raise_for_status()
        result = response.json()
    except Exception as exc:
        raise HTTPException(503, f"OCR service is unavailable: {exc}") from exc

    target_width, target_height = image_size
    source_width = max(int(result.get("width", target_width)), 1)
    source_height = max(int(result.get("height", target_height)), 1)
    scale_x = target_width / source_width
    scale_y = target_height / source_height
    labels = []
    for item in result.get("items", []):
        matched = room_class(str(item.get("text", "")))
        bbox = item.get("bbox") or []
        if matched is None or len(bbox) < 4:
            continue
        canonical, class_id = matched
        xs = [point[0] for point in bbox]
        ys = [point[1] for point in bbox]
        labels.append({
            "ocr_text": item["text"],
            "canonical": canonical,
            "class_id": class_id,
            "x": int(round((min(xs) + max(xs)) * 0.5 * scale_x)),
            "y": int(round((min(ys) + max(ys)) * 0.5 * scale_y)),
            "bbox_width": int(round((max(xs) - min(xs)) * scale_x)),
            "bbox_height": int(round((max(ys) - min(ys)) * scale_y)),
            "bbox_x0": int(round(min(xs) * scale_x)),
            "bbox_x1": int(round(max(xs) * scale_x)),
            "bbox_y0": int(round(min(ys) * scale_y)),
            "bbox_y1": int(round(max(ys) * scale_y)),
            "confidence": float(item.get("detector_confidence", 0.0)),
            "source": "aihub_ocr",
        })

    bedroom_labels = [label for label in labels if label["canonical"] == "침실"]
    master_labels = [label for label in bedroom_labels if "안방" in label["ocr_text"]]
    duplicate_distance = max(80, int(target_width * 0.05))
    labels = [
        label for label in labels
        if not (
            label["canonical"] == "침실"
            and "안방" not in label["ocr_text"]
            and any(
                other is not label
                and (other["x"] - label["x"]) ** 2 + (other["y"] - label["y"]) ** 2
                <= duplicate_distance ** 2
                for other in master_labels
            )
        )
    ]

    for canonical in {label["canonical"] for label in labels}:
        same = [label for label in labels if label["canonical"] == canonical]
        if canonical in {"침실", "욕실"} and len(same) > 1:
            masters = (
                [label for label in same if "안방" in label["ocr_text"]]
                if canonical == "침실"
                else []
            )
            numbered = [label for label in same if label not in masters]
            for label in masters:
                label["room_name"] = "안방"
                label["name_inferred"] = False

            # Preserve suffixes that the OCR actually read.  Only labels with
            # no explicit number use the previous right-to-left fallback, and
            # fallback numbers skip those already present in the drawing.
            used_numbers: set[int] = set()
            unnumbered = []
            for label in numbered:
                number_match = re.search(r"([1-9])", str(label["ocr_text"]))
                if number_match:
                    number = int(number_match.group(1))
                    used_numbers.add(number)
                    label["room_name"] = f"{canonical}{number}"
                    label["name_inferred"] = False
                else:
                    unnumbered.append(label)

            next_number = 1
            for label in sorted(
                unnumbered, key=lambda value: value["x"], reverse=True
            ):
                while next_number in used_numbers:
                    next_number += 1
                label["room_name"] = f"{canonical}{next_number}"
                label["name_inferred"] = True
                used_numbers.add(next_number)
                next_number += 1
        else:
            for label in same:
                label["room_name"] = label["ocr_text"]
                label["name_inferred"] = False
    return labels


def add_wic_fallback_label(original_pixels, mask, labels):
    if any(label["canonical"] in {"W.I.C", "WIC"} for label in labels):
        return labels
    entrances = [label for label in labels if label["canonical"] == "현관"]
    class_pixels = (mask == 7).astype(np.uint8)
    if not entrances or not class_pixels.any():
        return labels

    component_count, components = cv2.connectedComponents(class_pixels, connectivity=8)
    points = np.column_stack(np.where(class_pixels > 0))
    entrance = entrances[0]
    distances = (points[:, 0] - entrance["y"]) ** 2 + (points[:, 1] - entrance["x"]) ** 2
    nearest_y, nearest_x = points[int(np.argmin(distances))]
    component_id = int(components[nearest_y, nearest_x])
    if component_id <= 0 or component_id >= component_count:
        return labels

    component = components == component_id
    ys, xs = np.where(component)
    x0, x1 = max(int(xs.min()) - 30, 0), min(int(xs.max()) + 31, mask.shape[1])
    y0, y1 = max(int(ys.min()) - 30, 0), min(int(ys.max()) + 31, mask.shape[0])
    gray = cv2.cvtColor(original_pixels[y0:y1, x0:x1], cv2.COLOR_RGB2GRAY)
    _, binary = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(binary, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    candidates = []

    for contour in contours:
        x, y, width, height = cv2.boundingRect(contour)
        if not (60 <= width <= 250 and 20 <= height <= 100 and width / max(height, 1) >= 1.5):
            continue
        center_x, center_y = x0 + x + width // 2, y0 + y + height // 2
        if not (0 <= center_y < mask.shape[0] and 0 <= center_x < mask.shape[1]
                and component[center_y, center_x]):
            continue
        crop_x0, crop_x1 = max(x - 15, 0), min(x + width + 15, gray.shape[1])
        crop_y0, crop_y1 = max(y - 10, 0), min(y + height + 10, gray.shape[0])
        text_crop = cv2.resize(
            gray[crop_y0:crop_y1, crop_x0:crop_x1],
            None,
            fx=6,
            fy=6,
            interpolation=cv2.INTER_CUBIC,
        )
        raw = pytesseract.image_to_string(
            text_crop,
            config="--psm 7 -l eng -c tessedit_char_whitelist=WIC.",
        )
        letters = re.sub(r"[^A-Z]", "", raw.upper())
        if len(letters) <= 7 and re.search(r"W[A-Z]{0,3}I[A-Z]{0,3}C", letters):
            entrance_distance = (center_x - entrance["x"]) ** 2 + (center_y - entrance["y"]) ** 2
            if entrance_distance >= 40 ** 2:
                candidates.append((len(letters) - 3, -width * height, center_x, center_y, letters))

    if not candidates:
        return labels
    _, _, center_x, center_y, detected = min(candidates)
    labels.append({
        "ocr_text": "W.I.C",
        "canonical": "W.I.C",
        "class_id": 7,
        "x": int(center_x),
        "y": int(center_y),
        "confidence": 0.70,
        "room_name": "W.I.C",
        "name_inferred": False,
        "source": f"wic_aux_ocr:{detected}",
    })
    return labels


def wall_line_maps(original_pixels):
    """Keep long, dark, axis-aligned drawing lines while rejecting most text strokes."""
    gray = cv2.cvtColor(original_pixels, cv2.COLOR_RGB2GRAY)
    dark = (gray < 125).astype(np.uint8)
    line_length = max(25, int(round(max(original_pixels.shape[:2]) * 0.008)))
    vertical = cv2.morphologyEx(
        dark, cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_RECT, (3, line_length)),
    )
    horizontal = cv2.morphologyEx(
        dark, cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_RECT, (line_length, 3)),
    )
    return vertical.astype(bool), horizontal.astype(bool)


def _best_wall_cut(component, seeds, vertical_lines, horizontal_lines):
    ys, xs = np.where(component)
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    width, height = max(x1 - x0 + 1, 1), max(y1 - y0 + 1, 1)
    wall_support = cv2.dilate(
        component.astype(np.uint8),
        cv2.getStructuringElement(cv2.MORPH_RECT, (17, 17)),
    ).astype(bool)
    candidates = []
    fallback_candidates = []

    for axis, extent, lines in (
        ("x", width, vertical_lines), ("y", height, horizontal_lines)
    ):
        ordered = sorted(seeds, key=lambda item: item[axis])
        for first, second in zip(ordered, ordered[1:]):
            gap = int(second[axis] - first[axis])
            other_axis = "y" if axis == "x" else "x"
            other_gap = abs(int(second[other_axis] - first[other_axis]))
            # A pair stacked mostly top-to-bottom must be divided by a horizontal
            # wall; a pair arranged mostly left-to-right needs a vertical wall.
            if gap < other_gap * 0.75:
                continue
            if gap < max(20, int(extent * 0.06)):
                continue
            dominance = gap / max(other_gap, 1)
            start = int(first[axis] + gap * 0.20)
            stop = int(second[axis] - gap * 0.20)
            if stop <= start:
                continue
            scores = []
            occupancies = []
            for position in range(start, stop + 1):
                if axis == "x":
                    a, b = max(position - 2, 0), min(position + 3, component.shape[1])
                    score = int((lines[y0:y1 + 1, a:b] & wall_support[y0:y1 + 1, a:b]).sum())
                    occupancy = int(component[y0:y1 + 1, a:b].sum())
                else:
                    a, b = max(position - 2, 0), min(position + 3, component.shape[0])
                    score = int((lines[a:b, x0:x1 + 1] & wall_support[a:b, x0:x1 + 1]).sum())
                    occupancy = int(component[a:b, x0:x1 + 1].sum())
                scores.append(score)
                occupancies.append(occupancy)
            if dominance >= 1.50 and occupancies:
                fallback_candidates.append(
                    (dominance, axis, start + int(np.argmin(occupancies)))
                )
            best_index = int(np.argmax(scores))
            best_score = scores[best_index]
            required = max(18, int((height if axis == "x" else width) * 0.18))
            if best_score >= required:
                candidates.append((best_score / required, axis, start + best_index))

    if not candidates:
        if not fallback_candidates:
            return None
        _, axis, coordinate = max(fallback_candidates)
        return axis, coordinate
    _, axis, coordinate = max(candidates)
    return axis, coordinate


def split_component_on_detected_walls(component, seeds, vertical_lines, horizontal_lines):
    """Split only on a confirmed vertical/horizontal wall; never invent diagonals."""
    if len(seeds) <= 1:
        return [(component, seeds[0] if seeds else None)]
    cut = _best_wall_cut(component, seeds, vertical_lines, horizontal_lines)
    if cut is None:
        return [(component, None)]

    axis, coordinate = cut
    yy, xx = np.indices(component.shape)
    first_side = xx <= coordinate if axis == "x" else yy <= coordinate
    first_component = component & first_side
    second_component = component & ~first_side
    first_seeds = [seed for seed in seeds if seed[axis] <= coordinate]
    second_seeds = [seed for seed in seeds if seed[axis] > coordinate]
    if (not first_seeds or not second_seeds or
            int(first_component.sum()) < 100 or int(second_component.sum()) < 100):
        return [(component, None)]
    return (
        split_component_on_detected_walls(
            first_component, first_seeds, vertical_lines, horizontal_lines
        )
        + split_component_on_detected_walls(
            second_component, second_seeds, vertical_lines, horizontal_lines
        )
    )


def infer_missing_room(mask, label, vertical_lines, horizontal_lines):
    """Recover a missing OCR-labelled room only when four enclosing walls are found."""
    height, width = mask.shape
    x, y = int(label["x"]), int(label["y"])
    if not (0 <= x < width and 0 <= y < height):
        return None
    # Keep the search local so exterior dimension lines cannot become room walls.
    search_x = max(80, int(width * 0.07))
    search_y = max(80, int(height * 0.10))
    text_x0 = int(label.get("bbox_x0", x - 20))
    text_x1 = int(label.get("bbox_x1", x + 20))
    text_y0 = int(label.get("bbox_y0", y - 15))
    text_y1 = int(label.get("bbox_y1", y + 15))
    vertical_strength = vertical_lines[
        max(0, y - search_y):min(height, y + search_y + 1)
    ].sum(axis=0)
    horizontal_strength = horizontal_lines[
        :, max(0, x - search_x):min(width, x + search_x + 1)
    ].sum(axis=1)
    left = np.where((np.arange(width) >= max(0, x - search_x)) &
                    (np.arange(width) < text_x0 - 3) &
                    (vertical_strength >= max(20, int(search_y * 0.06))))[0]
    right = np.where((np.arange(width) > text_x1 + 3) &
                     (np.arange(width) <= min(width - 1, x + search_x)) &
                     (vertical_strength >= max(20, int(search_y * 0.06))))[0]
    top = np.where((np.arange(height) >= max(0, y - search_y)) &
                   (np.arange(height) < text_y0 - 3) &
                   (horizontal_strength >= max(20, int(search_x * 0.06))))[0]
    bottom = np.where((np.arange(height) > text_y1 + 3) &
                      (np.arange(height) <= min(height - 1, y + search_y)) &
                      (horizontal_strength >= max(20, int(search_x * 0.06))))[0]
    if not len(left) or not len(right) or not len(top) or not len(bottom):
        return None

    nearest_left, nearest_right = int(left[-1]), int(right[0])
    nearest_width = nearest_right - nearest_left
    label_width = max(int(label.get("bbox_width", 0)), 1)
    standard_limit = max(int(label_width * 1.35), label_width + 20)
    expanded_max = max(int(label_width * 2.25), label_width + 60)
    left_gain = max(float(vertical_strength[position]) for position in left) / max(
        float(vertical_strength[nearest_left]), 1.0
    )
    right_gain = max(float(vertical_strength[position]) for position in right) / max(
        float(vertical_strength[nearest_right]), 1.0
    )
    prefer_outer_wall = (
        label.get("class_id") == 101
        and standard_limit < nearest_width <= expanded_max
        and max(left_gain, right_gain) >= 3.5
    )

    def choose_wall(indices, strength, center):
        if prefer_outer_wall:
            # Utility rooms often contain appliance strokes close to the text.
            # Prefer long outer wall lines over those internal fixture lines.
            peak = max(float(strength[position]) for position in indices)
            strong = [
                position for position in indices
                if float(strength[position]) >= peak * 0.70
            ]
            return int(min(strong, key=lambda position: abs(position - center)))
        radius = max(12, int(max(width, height) * 0.005))
        def score(position):
            density = float(strength[max(0, position - radius):position + radius + 1].sum())
            distance_penalty = max(abs(position - center), 1) ** 0.25
            return density / distance_penalty
        return int(max(indices, key=score))

    if nearest_width <= standard_limit or prefer_outer_wall:
        # A narrow rectangle around the OCR box is usually text, furniture, or
        # an appliance outline rather than the room's outer wall.
        wall_left = choose_wall(left, vertical_strength, x)
        wall_right = choose_wall(right, vertical_strength, x)
    else:
        wall_left, wall_right = nearest_left, nearest_right
    wall_top = choose_wall(top, horizontal_strength, y)
    wall_bottom = choose_wall(bottom, horizontal_strength, y)
    x0, x1 = wall_left + 3, wall_right - 2
    y0, y1 = wall_top + 3, wall_bottom - 2
    if x1 - x0 < 25 or y1 - y0 < 25:
        return None
    rectangle_area = (x1 - x0 + 1) * (y1 - y0 + 1)
    if rectangle_area > int(mask.size * 0.06):
        return None

    region = np.zeros(mask.shape, dtype=bool)
    region[y0:y1 + 1, x0:x1 + 1] = mask[y0:y1 + 1, x0:x1 + 1] == 0
    wall_block = cv2.dilate(
        (vertical_lines | horizontal_lines).astype(np.uint8),
        cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7)),
    ).astype(bool)
    region &= ~wall_block
    pixel_count = int(region.sum())
    if pixel_count < 300 or pixel_count / rectangle_area < 0.55:
        return None
    nearby = region[
        max(0, y - 12):min(height, y + 13), max(0, x - 12):min(width, x + 13)
    ]
    if not nearby.any():
        return None
    return region


def infer_missing_outdoor_unit_room(mask, label, original_pixels):
    """Recover a small OCR-confirmed outdoor-unit room with faint/short walls."""
    if label.get("class_id") != 102:
        return None

    gray = cv2.cvtColor(original_pixels, cv2.COLOR_RGB2GRAY)
    dark = (gray < 165).astype(np.uint8)
    line_length = max(18, int(round(max(original_pixels.shape[:2]) * 0.004)))
    vertical_lines = cv2.morphologyEx(
        dark,
        cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_RECT, (3, line_length)),
    ).astype(bool)
    horizontal_lines = cv2.morphologyEx(
        dark,
        cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_RECT, (line_length, 3)),
    ).astype(bool)

    height, width = mask.shape
    x, y = int(label["x"]), int(label["y"])
    search_x = max(90, int(width * 0.07))
    search_y = max(90, int(height * 0.10))
    vertical_strength = vertical_lines[
        max(0, y - search_y):min(height, y + search_y + 1)
    ].sum(axis=0)
    horizontal_strength = horizontal_lines[
        :, max(0, x - search_x):min(width, x + search_x + 1)
    ].sum(axis=1)

    def grouped_lines(strength, minimum):
        indices = np.where(strength >= minimum)[0]
        groups = []
        for position in indices:
            if not groups or position > groups[-1][-1] + 1:
                groups.append([])
            groups[-1].append(int(position))
        return [
            {
                "coord": int(round(sum(group) / len(group))),
                "strength": max(float(strength[position]) for position in group),
            }
            for group in groups
        ]

    vertical_groups = grouped_lines(
        vertical_strength, max(18, int(search_y * 0.045))
    )
    horizontal_groups = grouped_lines(
        horizontal_strength, max(18, int(search_x * 0.045))
    )
    text_x0 = int(label.get("bbox_x0", x - 20))
    text_x1 = int(label.get("bbox_x1", x + 20))
    text_y0 = int(label.get("bbox_y0", y - 15))
    text_y1 = int(label.get("bbox_y1", y + 15))
    label_width = max(int(label.get("bbox_width", 0)), 1)
    label_height = max(int(label.get("bbox_height", 0)), 1)

    left = [
        line for line in vertical_groups
        if x - search_x <= line["coord"] <= text_x0 - max(10, label_height // 3)
    ]
    right = [
        line for line in vertical_groups
        if text_x1 + max(8, label_height // 4) <= line["coord"] <= x + search_x
    ]
    vertical_pairs = [
        (first, second)
        for first in left
        for second in right
        if max(50, int(label_width * 1.10))
        <= second["coord"] - first["coord"]
        <= max(320, int(label_width * 2.80))
    ]
    if not vertical_pairs:
        return None
    wall_left, wall_right = max(
        vertical_pairs,
        key=lambda pair: (
            pair[0]["strength"] + pair[1]["strength"]
            - abs((pair[0]["coord"] + pair[1]["coord"]) * 0.5 - x) * 0.25
            - (pair[1]["coord"] - pair[0]["coord"]) * 0.12
        ),
    )
    room_width = wall_right["coord"] - wall_left["coord"]

    top = [
        line for line in horizontal_groups
        if y - search_y <= line["coord"] <= text_y0 - max(16, label_height // 2)
    ]
    bottom = [
        line for line in horizontal_groups
        if text_y1 + max(16, label_height // 2) <= line["coord"] <= y + search_y
    ]
    horizontal_pairs = [
        (first, second)
        for first in top
        for second in bottom
        if max(80, int(room_width * 0.72))
        <= second["coord"] - first["coord"]
        <= max(380, int(room_width * 2.50))
    ]
    if not horizontal_pairs:
        return None
    wall_top, wall_bottom = max(
        horizontal_pairs,
        key=lambda pair: (
            pair[0]["strength"] + pair[1]["strength"]
            - abs((pair[0]["coord"] + pair[1]["coord"]) * 0.5 - y) * 0.18
        ),
    )

    x0, x1 = wall_left["coord"] + 4, wall_right["coord"] - 3
    y0, y1 = wall_top["coord"] + 4, wall_bottom["coord"] - 3
    rectangle_area = max(x1 - x0 + 1, 0) * max(y1 - y0 + 1, 0)
    if rectangle_area < 1200 or rectangle_area > int(mask.size * 0.025):
        return None

    region = np.zeros(mask.shape, dtype=bool)
    region[y0:y1 + 1, x0:x1 + 1] = mask[y0:y1 + 1, x0:x1 + 1] == 0
    wall_block = cv2.dilate(
        (vertical_lines | horizontal_lines).astype(np.uint8),
        cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5)),
    ).astype(bool)
    region &= ~wall_block
    pixel_count = int(region.sum())
    if pixel_count < 500 or pixel_count / rectangle_area < 0.58:
        return None
    if not region[
        max(0, y - 12):min(height, y + 13),
        max(0, x - 12):min(width, x + 13),
    ].any():
        return None
    return region


AUX_ENGLISH_ROOM_NAMES = {
    "WIC": "W.I.C",
    "WLC": "W.I.C",
    "WILC": "W.I.C",
    "W1C": "W.I.C",
    "PANTRY": "PANTRY",
    "STORAGE": "STORAGE",
    "STORE": "STORAGE",
    "DRESSROOM": "DRESS ROOM",
    "DRESS": "DRESS ROOM",
    "UTILITY": "UTILITY",
    "LAUNDRY": "LAUNDRY",
    "FOYER": "FOYER",
    "ENTRANCE": "ENTRANCE",
    "CLOSET": "CLOSET",
}


def _read_aux_english_room_name(crop):
    """Read an English room name after removing long grid and wall lines."""
    if crop.size == 0:
        return None
    gray = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY)
    binary = cv2.threshold(gray, 190, 255, cv2.THRESH_BINARY_INV)[1]
    line_length = max(30, int(round(min(gray.shape[:2]) * 0.13)))
    vertical = cv2.morphologyEx(
        binary,
        cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_RECT, (1, line_length)),
    )
    horizontal = cv2.morphologyEx(
        binary,
        cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_RECT, (line_length, 1)),
    )
    cleaned = cv2.subtract(binary, cv2.bitwise_or(vertical, horizontal))
    cleaned = cv2.morphologyEx(
        cleaned,
        cv2.MORPH_CLOSE,
        cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2)),
    )

    recognized = []
    for variant in (gray, 255 - cleaned):
        enlarged = cv2.resize(
            variant, None, fx=5, fy=5, interpolation=cv2.INTER_CUBIC
        )
        raw = pytesseract.image_to_string(
            enlarged,
            config="--psm 11 -l eng",
        )
        for token in re.findall(r"[A-Za-z0-9.]{2,}", raw.upper()):
            compact = re.sub(r"[^A-Z0-9]", "", token)
            if compact in AUX_ENGLISH_ROOM_NAMES:
                recognized.append((AUX_ENGLISH_ROOM_NAMES[compact], token))

    if not recognized:
        return None
    return max(recognized, key=lambda item: len(item[0]))


def apply_aux_english_ocr(instances, original_pixels):
    """Name only SPA-produced, still-unnamed components using cropped English OCR."""
    existing_names = {
        re.sub(r"[^A-Z]", "", str(instance.get("room_name", "")).upper())
        for instance in instances
        if not str(instance.get("room_name", "")).startswith("class_")
    }
    image_area = original_pixels.shape[0] * original_pixels.shape[1]

    for instance in instances:
        if not str(instance.get("room_name", "")).startswith("class_"):
            continue
        box = instance.get("bbox") or {}
        x = int(box.get("x", 0))
        y = int(box.get("y", 0))
        width = int(box.get("width", 0))
        height = int(box.get("height", 0))
        box_area = width * height
        fill_ratio = int(instance.get("pixel_count", 0)) / max(box_area, 1)
        if (
            width < 70
            or height < 55
            or box_area < 3500
            or box_area > int(image_area * 0.06)
            or fill_ratio < 0.48
        ):
            continue

        pad = max(20, int(round(min(width, height) * 0.10)))
        x0, x1 = max(x - pad, 0), min(x + width + pad, original_pixels.shape[1])
        y0, y1 = max(y - pad, 0), min(y + height + pad, original_pixels.shape[0])
        detected = _read_aux_english_room_name(original_pixels[y0:y1, x0:x1])
        if detected is None:
            continue
        room_name, raw_token = detected
        compact_name = re.sub(r"[^A-Z]", "", room_name.upper())
        if compact_name in existing_names:
            continue

        instance["room_name"] = room_name
        instance["name_inferred"] = False
        instance["ocr_confidence"] = 0.72
        instance["label_source"] = f"aux_english_crop_ocr:{raw_token}"
        instance["method"] = f"{instance['method']}+aux_english_crop_ocr"
        instance["ocr_anchor"] = [
            int(x + width * 0.5),
            int(y + height * 0.5),
        ]
        existing_names.add(compact_name)
    return instances


def room_instances(mask, original_pixels, ocr_labels):
    instances = []
    instance_id = 0
    vertical_lines, horizontal_lines = wall_line_maps(original_pixels)
    labels_by_class = {}
    for label in ocr_labels:
        labels_by_class.setdefault(label["class_id"], []).append(label)

    for class_id in range(1, 14):
        class_pixels = (mask == class_id).astype(np.uint8)
        component_count, components = cv2.connectedComponents(class_pixels, connectivity=8)
        class_labels = labels_by_class.get(class_id, [])

        for label in class_labels:
            points = np.column_stack(np.where(class_pixels > 0))
            if not len(points):
                label["component_id"] = 0
                continue
            distances = (points[:, 0] - label["y"]) ** 2 + (points[:, 1] - label["x"]) ** 2
            nearest_y, nearest_x = points[int(np.argmin(distances))]
            label["component_id"] = int(components[nearest_y, nearest_x])

        for component_id in range(1, component_count):
            component = components == component_id
            if int(component.sum()) < 20:
                continue
            seeds = [label for label in class_labels if label.get("component_id") == component_id]
            if len(seeds) > 1:
                region_seed_pairs = split_component_on_detected_walls(
                    component, seeds, vertical_lines, horizontal_lines
                )
                split_succeeded = len(region_seed_pairs) > 1
                method = (
                    "ocr_seeded_detected_wall_split" if split_succeeded
                    else "original_component_wall_not_confirmed"
                )
            else:
                region_seed_pairs = [(component, seeds[0] if seeds else None)]
                method = "original_connected_component"

            for region, seed in region_seed_pairs:
                pixel_count = int(region.sum())
                if pixel_count < 20:
                    continue
                ys, xs = np.where(region)
                instance_id += 1
                instances.append({
                    "instance_id": instance_id,
                    "class_id": class_id,
                    "room_name": seed["room_name"] if seed else f"class_{class_id}_{component_id}",
                    "pixel_count": pixel_count,
                    "bbox": {
                        "x": int(xs.min()), "y": int(ys.min()),
                        "width": int(xs.max() - xs.min() + 1),
                        "height": int(ys.max() - ys.min() + 1),
                    },
                    "method": method,
                    "name_inferred": bool(seed and seed.get("name_inferred", False)),
                    "ocr_confidence": seed["confidence"] if seed else None,
                    "label_source": seed.get("source") if seed else None,
                    "ocr_anchor": [seed["x"], seed["y"]] if seed else None,
                    "mask": region,
                })

    for label in ocr_labels:
        if label["class_id"] not in SUPPLEMENTAL_ROOM_IDS:
            continue
        # Do not duplicate a room that the SPA model already detected.
        if label.get("component_id", 0) > 0:
            continue
        region = infer_missing_room(mask, label, vertical_lines, horizontal_lines)
        if region is None:
            region = infer_missing_outdoor_unit_room(mask, label, original_pixels)
        if region is None:
            continue
        ys, xs = np.where(region)
        instance_id += 1
        instances.append({
            "instance_id": instance_id,
            "class_id": label["class_id"],
            "room_name": label["room_name"],
            "pixel_count": int(region.sum()),
            "bbox": {
                "x": int(xs.min()), "y": int(ys.min()),
                "width": int(xs.max() - xs.min() + 1),
                "height": int(ys.max() - ys.min() + 1),
            },
            "method": "ocr_label_four_wall_enclosure",
            "name_inferred": False,
            "ocr_confidence": label["confidence"],
            "label_source": label.get("source"),
            "ocr_anchor": [label["x"], label["y"]],
            "mask": region,
        })
    return instances


def viewer_geometry_from_mask(region):
    """Build viewer polygons directly from an already-computed room mask."""
    room_mask = region.astype(np.uint8) * 255
    room_mask = cv2.morphologyEx(
        room_mask, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8)
    )
    contours, _ = cv2.findContours(
        room_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    polygons = []
    for contour in contours:
        if cv2.contourArea(contour) < 80:
            continue
        perimeter = cv2.arcLength(contour, True)
        simplified = cv2.approxPolyDP(
            contour, max(1.5, perimeter * 0.0025), True
        )
        points = [
            [int(point[0][0]), int(point[0][1])]
            for point in simplified
        ]
        if len(points) >= 3:
            polygons.append(points)
    polygons.sort(
        key=lambda polygon: abs(
            cv2.contourArea(np.asarray(polygon, dtype=np.int32))
        ),
        reverse=True,
    )
    distance_map = cv2.distanceTransform(room_mask, cv2.DIST_L2, 5)
    _, radius, _, anchor = cv2.minMaxLoc(distance_map)
    return {
        "polygons": polygons[:4],
        "viewer_anchor": [int(anchor[0]), int(anchor[1])],
        "viewer_radius": float(radius),
    }


def fill_small_internal_openings(instances, original_pixels):
    """Fill small unlabelled floor gaps up to wall lines without crossing walls/exterior."""
    if not instances:
        return instances
    height, width = instances[0]["mask"].shape
    instance_map = np.zeros((height, width), dtype=np.int16)
    for index, instance in enumerate(instances, 1):
        instance_map[instance["mask"]] = index
    occupied = instance_map > 0

    bridge = max(24, int(round(max(height, width) * 0.018)))
    occupied_u8 = occupied.astype(np.uint8)
    closed_horizontal = cv2.morphologyEx(
        occupied_u8, cv2.MORPH_CLOSE,
        cv2.getStructuringElement(cv2.MORPH_RECT, (bridge, 5)),
    ).astype(bool)
    closed_vertical = cv2.morphologyEx(
        occupied_u8, cv2.MORPH_CLOSE,
        cv2.getStructuringElement(cv2.MORPH_RECT, (5, bridge)),
    ).astype(bool)
    corner_size = max(9, bridge // 3)
    closed_corners = cv2.morphologyEx(
        occupied_u8, cv2.MORPH_CLOSE,
        cv2.getStructuringElement(cv2.MORPH_RECT, (corner_size, corner_size)),
    ).astype(bool)

    vertical_lines, horizontal_lines = wall_line_maps(original_pixels)
    wall_block = cv2.dilate(
        (vertical_lines | horizontal_lines).astype(np.uint8),
        cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5)),
    ).astype(bool)
    candidates = (
        (closed_horizontal | closed_vertical | closed_corners)
        & ~occupied & ~wall_block
    )
    component_count, component_labels, stats, _ = cv2.connectedComponentsWithStats(
        candidates.astype(np.uint8), connectivity=8
    )

    for component_id in range(1, component_count):
        x, y, box_width, box_height, area = stats[component_id].tolist()
        if area < 4 or area > bridge * bridge * 5:
            continue
        component = component_labels == component_id
        border = cv2.dilate(
            component.astype(np.uint8),
            cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7)),
        ).astype(bool) & ~component
        touching = [int(value) for value in np.unique(instance_map[border]) if value > 0]
        if not touching:
            continue
        if len(touching) == 1:
            instance_map[component] = touching[0]
            continue

        margin = bridge
        x0, x1 = max(x - margin, 0), min(x + box_width + margin, width)
        y0, y1 = max(y - margin, 0), min(y + box_height + margin, height)
        local_component = component[y0:y1, x0:x1]
        best_distance = np.full(local_component.shape, np.inf, dtype=np.float32)
        best_owner = np.zeros(local_component.shape, dtype=np.int16)
        local_map = instance_map[y0:y1, x0:x1]
        for owner in touching:
            distance = cv2.distanceTransform(
                (local_map != owner).astype(np.uint8), cv2.DIST_L2, 3
            )
            better = local_component & (distance < best_distance)
            best_distance[better] = distance[better]
            best_owner[better] = owner
        local_map[local_component] = best_owner[local_component]

    for index, instance in enumerate(instances, 1):
        expanded = instance_map == index
        added = int(expanded.sum()) - int(instance["mask"].sum())
        if added <= 0:
            continue
        instance["mask"] = expanded
        instance["pixel_count"] = int(expanded.sum())
        ys, xs = np.where(expanded)
        instance["bbox"] = {
            "x": int(xs.min()), "y": int(ys.min()),
            "width": int(xs.max() - xs.min() + 1),
            "height": int(ys.max() - ys.min() + 1),
        }
        instance["interior_gap_pixels_added"] = added
    return instances


def _refresh_instance_geometry(instance):
    region = instance["mask"]
    instance["pixel_count"] = int(region.sum())
    ys, xs = np.where(region)
    if not len(xs):
        instance["bbox"] = {"x": 0, "y": 0, "width": 0, "height": 0}
        return
    instance["bbox"] = {
        "x": int(xs.min()), "y": int(ys.min()),
        "width": int(xs.max() - xs.min() + 1),
        "height": int(ys.max() - ys.min() + 1),
    }


def _stable_edge_y(region, edge):
    """Estimate a horizontal room edge while ignoring a few stray pixels."""
    columns = np.where(region.any(axis=0))[0]
    if not len(columns):
        return None
    values = []
    for x in columns:
        ys = np.where(region[:, x])[0]
        if len(ys):
            values.append(int(ys.min() if edge == "top" else ys.max()))
    if not values:
        return None
    values = np.asarray(values)
    quantile = 0.20 if edge == "top" else 0.80
    return int(round(float(np.quantile(values, quantile))))


def reassign_master_bedroom_lobe(instances):
    """Move a wrongly joined bedroom lobe back to the OCR-confirmed master room.

    The correction is deliberately narrow: it requires an OCR-labelled master
    room, bedroom 2, and a balcony under the left lobe.  It transfers existing
    instance pixels only; no pixels are created or removed, and the raw AI Hub
    class mask remains unchanged.
    """

    def compact_name(instance):
        return str(instance.get("room_name") or "").replace(" ", "")

    master = next(
        (item for item in instances if "\uc548\ubc29" in compact_name(item)), None
    )
    bedroom = next(
        (item for item in instances if "\uce68\uc2e42" in compact_name(item)), None
    )
    balconies = [
        item for item in instances if "\ubc1c\ucf54\ub2c8" in compact_name(item)
    ]
    if master is None or bedroom is None or not balconies:
        return {"applied": False, "reason": "required_ocr_rooms_missing"}
    if int(master.get("class_id", -1)) != int(bedroom.get("class_id", -2)):
        return {"applied": False, "reason": "bedroom_classes_disagree"}

    master_mask = master["mask"]
    bedroom_mask = bedroom["mask"]
    if master_mask.shape != bedroom_mask.shape:
        return {"applied": False, "reason": "mask_shapes_disagree"}

    my, mx = np.where(master_mask)
    by, bx = np.where(bedroom_mask)
    if not len(mx) or not len(bx):
        return {"applied": False, "reason": "empty_room_mask"}
    master_box = (int(mx.min()), int(my.min()), int(mx.max()), int(my.max()))
    bedroom_box = (int(bx.min()), int(by.min()), int(bx.max()), int(by.max()))

    height, width = bedroom_mask.shape
    adjacency = max(14, min(32, int(round(min(height, width) * 0.009))))
    if abs(master_box[0] - bedroom_box[0]) > adjacency:
        return {"applied": False, "reason": "left_edges_not_aligned"}
    if abs(master_box[3] - bedroom_box[1]) > adjacency:
        return {"applied": False, "reason": "rooms_not_vertically_adjacent"}

    balcony = None
    balcony_box = None
    for candidate in balconies:
        cy, cx = np.where(candidate["mask"])
        if not len(cx):
            continue
        box = (int(cx.min()), int(cy.min()), int(cx.max()), int(cy.max()))
        if (
            abs(box[0] - bedroom_box[0]) <= adjacency
            and box[1] > bedroom_box[1]
            and box[1] < bedroom_box[3]
        ):
            balcony = candidate
            balcony_box = box
            break
    if balcony is None:
        return {"applied": False, "reason": "supporting_balcony_missing"}

    # The true bedroom is the part continuing below the balcony.  Its first
    # deep column gives the vertical wall separating it from the master lobe.
    deep_y = min(balcony_box[3] + max(6, adjacency // 2), height - 1)
    deep_columns = np.where(bedroom_mask[deep_y:, :].any(axis=0))[0]
    if not len(deep_columns):
        return {"applied": False, "reason": "bedroom_has_no_deep_rectangle"}
    split_x = int(deep_columns.min())
    if not (bedroom_box[0] + adjacency < split_x < bedroom_box[2] - adjacency):
        return {"applied": False, "reason": "invalid_vertical_split"}
    if abs((balcony_box[2] + 1) - split_x) > adjacency:
        return {"applied": False, "reason": "balcony_does_not_confirm_split"}

    yy, xx = np.indices(bedroom_mask.shape)
    # A one-pixel wall-edge tail can continue below the real left lobe.  Limit
    # the transfer to the balcony-confirmed horizontal boundary so that only
    # the room surface moves and the thin residual edge cannot distort either
    # resulting polygon.
    transfer_limit_y = min(balcony_box[1] + adjacency, height - 1)
    transfer = bedroom_mask & (xx < split_x) & (yy <= transfer_limit_y)
    transferred_pixels = int(transfer.sum())
    bedroom_pixels_before = int(bedroom_mask.sum())
    if transferred_pixels < 300:
        return {"applied": False, "reason": "lobe_too_small"}
    transfer_ratio = transferred_pixels / max(bedroom_pixels_before, 1)
    if not 0.08 <= transfer_ratio <= 0.48:
        return {"applied": False, "reason": "lobe_ratio_out_of_range"}

    if master_mask[transfer].any():
        return {"applied": False, "reason": "target_overlap_detected"}

    total_before = int(master_mask.sum() + bedroom_mask.sum())
    bedroom["mask"][transfer] = False
    master["mask"][transfer] = True
    _refresh_instance_geometry(master)
    _refresh_instance_geometry(bedroom)
    total_after = int(master["mask"].sum() + bedroom["mask"].sum())
    if total_before != total_after:
        raise RuntimeError("master-bedroom transfer must preserve total pixels")

    for instance in (master, bedroom):
        instance["boundary_postprocess"] = "ocr_balcony_confirmed_master_bedroom_split"
        instance["method"] = (
            f"{instance.get('method', 'room_instance')}"
            "+ocr_balcony_confirmed_master_bedroom_split"
        )
    return {
        "applied": True,
        "split_x": split_x,
        "transfer_limit_y": transfer_limit_y,
        "transferred_pixels": transferred_pixels,
        "total_pixels_preserved": True,
        "master_pixel_count": int(master["pixel_count"]),
        "bedroom_pixel_count": int(bedroom["pixel_count"]),
    }


def snap_confirmed_kitchen_living_boundary(instances):
    """Straighten only a small kitchen/living overlap confirmed by a bathroom wall.

    This changes post-processed room instances only. The AI Hub SPA class mask and
    model output remain untouched.
    """
    living_rooms = [item for item in instances if item["class_id"] == 4]
    kitchen_rooms = [item for item in instances if item["class_id"] == 6]
    bathroom_rooms = [item for item in instances if item["class_id"] == 9]
    if not living_rooms or not kitchen_rooms or not bathroom_rooms:
        return {"applied": False, "reason": "required_classes_missing"}

    living = max(living_rooms, key=lambda item: item["pixel_count"])
    kitchen = max(kitchen_rooms, key=lambda item: item["pixel_count"])
    living_top = _stable_edge_y(living["mask"], "top")
    kitchen_top = _stable_edge_y(kitchen["mask"], "top")
    kitchen_bottom = _stable_edge_y(kitchen["mask"], "bottom")
    bathroom_bottoms = [
        value
        for value in (
            _stable_edge_y(item["mask"], "bottom") for item in bathroom_rooms
        )
        if value is not None
    ]
    if None in {living_top, kitchen_top, kitchen_bottom} or not bathroom_bottoms:
        return {"applied": False, "reason": "edge_detection_failed"}

    target_y = min(bathroom_bottoms, key=lambda value: abs(value - living_top))
    kitchen_height = max(kitchen_bottom - kitchen_top + 1, 1)
    tolerance = max(18, int(round(kitchen_height * 0.12)))
    overlap = kitchen_bottom - target_y

    # The bathroom bottom and living-room top must independently confirm nearly
    # the same line. Large overlaps represent a real open-plan layout, not noise.
    if abs(target_y - living_top) > tolerance:
        return {"applied": False, "reason": "reference_lines_disagree"}
    if overlap <= 0 or overlap > tolerance:
        return {"applied": False, "reason": "overlap_not_small"}

    yy = np.indices(kitchen["mask"].shape)[0]
    transfer = kitchen["mask"] & (yy > target_y)
    transferred_pixels = int(transfer.sum())
    if transferred_pixels < 20:
        return {"applied": False, "reason": "too_few_pixels"}

    total_before = int(kitchen["mask"].sum() + living["mask"].sum())
    kitchen["mask"][transfer] = False
    living["mask"][transfer] = True
    _refresh_instance_geometry(kitchen)
    _refresh_instance_geometry(living)
    total_after = int(kitchen["mask"].sum() + living["mask"].sum())
    if total_before != total_after:
        raise RuntimeError("boundary snap must preserve the total room pixel count")

    kitchen["boundary_postprocess"] = "bathroom_confirmed_horizontal_snap"
    living["boundary_postprocess"] = "bathroom_confirmed_horizontal_snap"
    return {
        "applied": True,
        "target_y": int(target_y),
        "living_reference_y": int(living_top),
        "kitchen_overlap_pixels_y": int(overlap),
        "transferred_pixels": transferred_pixels,
        "total_pixels_preserved": True,
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "spa",
        "models": {key: os.path.isfile(path) for key, path in MODEL_PATHS.items()},
    }


@app.post("/segment")
async def segment(
    file: UploadFile = File(...),
    model_type: str = Form("FP"),
    result_type: ResultType = Form(ResultType.colored_image),
    straighten_boundaries: bool = Form(False),
):
    if file.content_type not in {"image/jpeg", "image/png"}:
        raise HTTPException(415, "Only JPG and PNG images are supported")
    model_type = model_type.upper()
    if model_type not in MODEL_PATHS:
        raise HTTPException(400, "model_type must be FP or CS")
    try:
        predictor = load_model(model_type)
    except FileNotFoundError as exc:
        raise HTTPException(503, f"SPA {model_type} model file is missing: {exc}") from exc

    content = await file.read()
    original, tensor, active_size = prepare_image(content)
    with torch.inference_mode():
        prediction = predictor(tensor).squeeze(0).cpu().numpy()

    confidence = prediction.transpose(1, 2, 0)
    mask = (confidence.max(axis=-1).round() * (confidence.argmax(axis=-1) + 1)).astype(np.uint8)
    width, height = active_size
    mask = mask[:height, :width]
    mask = cv2.resize(mask, original.size, interpolation=cv2.INTER_NEAREST)

    if result_type in {ResultType.room_colored_image, ResultType.room_json}:
        original_pixels = np.asarray(original).copy()
        ocr_labels = ocr_room_labels(content, file.content_type, original.size)
        # Preserve the existing, proven W.I.C crop reader first (e.g. plan 2).
        # The generic unnamed-room OCR below runs only when this path did not
        # already provide a room label.
        ocr_labels = add_wic_fallback_label(original_pixels, mask, ocr_labels)
        instances = room_instances(mask, original_pixels, ocr_labels)
        instances = apply_aux_english_ocr(instances, original_pixels)
        instances = fill_small_internal_openings(instances, original_pixels)
        master_bedroom_postprocess = reassign_master_bedroom_lobe(instances)
        boundary_postprocess = (
            snap_confirmed_kitchen_living_boundary(instances)
            if straighten_boundaries
            else {"applied": False, "reason": "disabled"}
        )

        if result_type == ResultType.room_json:
            public_instances = []
            for instance in instances:
                public_instance = {
                    key: value for key, value in instance.items() if key != "mask"
                }
                public_instance.update(viewer_geometry_from_mask(instance["mask"]))
                public_instances.append(public_instance)
            payload = {
                "image_width": int(mask.shape[1]),
                "image_height": int(mask.shape[0]),
                "total_area_pixel_count": total_area_pixel_count(instances),
                "model_type": model_type,
                "spa_model_modified": False,
                "method": "SPA + OCR labels + confirmed axis-aligned wall post-processing",
                "boundary_postprocess": boundary_postprocess,
                "master_bedroom_postprocess": master_bedroom_postprocess,
                "viewer_geometry_source": "single_spa_inference_room_masks",
                "rooms": public_instances,
            }
            buffer = io.BytesIO(json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8"))
            return StreamingResponse(
                buffer,
                media_type="application/json",
                headers={"Content-Disposition": "attachment; filename=spa-rooms.json"},
            )

        colored = np.full_like(original_pixels, 255)
        foreground = np.zeros(mask.shape, dtype=bool)
        for color_index, instance in enumerate(instances):
            region = instance["mask"]
            colored[region] = DISPLAY_COLORS[color_index % len(DISPLAY_COLORS)]
            foreground |= region
        visual = original_pixels.copy()
        visual[foreground] = (
            original_pixels[foreground].astype(np.float32) * 0.35
            + colored[foreground].astype(np.float32) * 0.65
        ).astype(np.uint8)
        for label in ocr_labels:
            cv2.circle(visual, (label["x"], label["y"]), 7, (255, 0, 0), -1)
        for instance in instances:
            if not str(instance.get("label_source", "")).startswith(
                "aux_english_crop_ocr:"
            ):
                continue
            box = instance["bbox"]
            center = (
                int(box["x"] + box["width"] * 0.5),
                int(box["y"] + box["height"] * 0.5),
            )
            cv2.circle(visual, center, 7, (255, 0, 0), -1)

        buffer = io.BytesIO()
        Image.fromarray(visual, mode="RGB").save(buffer, format="PNG")
        buffer.seek(0)
        return StreamingResponse(
            buffer,
            media_type="image/png",
            headers={
                "X-SpaceUP-Model": model_type,
                "X-SpaceUP-Postprocess": (
                    "ocr-confirmed-wall-split+safe-horizontal-boundary-snap"
                ),
                "Content-Disposition": "inline; filename=room-mask.png",
            },
        )

    if result_type == ResultType.pixel_json:
        classes = []
        for class_id in range(0, 14):
            class_pixels = (mask == class_id).astype(np.uint8)
            pixel_count = int(class_pixels.sum())
            if pixel_count == 0:
                continue

            components = []
            if class_id != 0:
                component_count, labels, stats, _ = cv2.connectedComponentsWithStats(
                    class_pixels, connectivity=8
                )
                for component_id in range(1, component_count):
                    x, y, width, height, area = stats[component_id].tolist()
                    if area < 20:
                        continue
                    components.append({
                        "component_id": component_id,
                        "pixel_count": int(area),
                        "bbox": {"x": x, "y": y, "width": width, "height": height},
                    })

            classes.append({
                "class_id": class_id,
                "pixel_count": pixel_count,
                "components": components,
            })

        payload = {
            "image_width": int(mask.shape[1]),
            "image_height": int(mask.shape[0]),
            "total_pixels": int(mask.size),
            "model_type": model_type,
            "pixel_value_range": "0=background, 1-13=AI Hub SPA class IDs",
            "classes": classes,
        }
        buffer = io.BytesIO(json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8"))
        return StreamingResponse(
            buffer,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=spa-pixels.json"},
        )

    original_pixels = np.asarray(original).copy()
    colored = np.full_like(original_pixels, 255)
    color_index = 0
    for class_id in range(1, 14):
        class_pixels = (mask == class_id).astype(np.uint8)
        component_count, components = cv2.connectedComponents(class_pixels, connectivity=8)
        for component_id in range(1, component_count):
            component = components == component_id
            if int(component.sum()) < 20:
                continue
            colored[component] = DISPLAY_COLORS[color_index % len(DISPLAY_COLORS)]
            color_index += 1

    foreground = mask > 0
    visual = original_pixels.copy()
    visual[foreground] = (
        original_pixels[foreground].astype(np.float32) * 0.35
        + colored[foreground].astype(np.float32) * 0.65
    ).astype(np.uint8)

    buffer = io.BytesIO()
    Image.fromarray(visual, mode="RGB").save(buffer, format="PNG")
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="image/png",
        headers={
            "X-SpaceUP-Model": model_type,
            "Content-Disposition": "inline; filename=mask.png",
        },
    )
