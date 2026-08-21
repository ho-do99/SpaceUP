import json
import os
import io
from pathlib import Path

import cv2
import numpy as np
import requests
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image


APP_DIR = Path(__file__).resolve().parent
STATIC_DIR = APP_DIR / "static"
SPA_URL = os.getenv("SPA_URL", "http://spa:8000")
OCR_URL = os.getenv("OCR_URL", "http://ocr:8000")
DISPLAY_COLORS = np.array(
    [
        [46, 204, 113], [52, 152, 219], [155, 89, 182],
        [241, 196, 15], [230, 126, 34], [231, 76, 60],
        [26, 188, 156], [142, 68, 173], [243, 156, 18],
        [22, 160, 133], [41, 128, 185], [192, 57, 43],
        [127, 140, 141], [39, 174, 96], [211, 84, 0],
        [52, 73, 94], [255, 105, 180], [0, 188, 212],
        [124, 179, 66], [255, 112, 67],
    ],
    dtype=np.uint8,
)

app = FastAPI(title="SpaceUP 3D Floor Plan Viewer", version="1.0.0")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", include_in_schema=False, response_class=HTMLResponse)
def index():
    return HTMLResponse(
        (STATIC_DIR / "index.html").read_text(encoding="utf-8"),
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    )


@app.get("/health")
def health():
    try:
        response = requests.get(f"{SPA_URL}/health", timeout=3)
        spa_ready = response.ok
    except requests.RequestException:
        spa_ready = False
    try:
        response = requests.get(f"{OCR_URL}/health", timeout=3)
        ocr_ready = response.ok
    except requests.RequestException:
        ocr_ready = False
    return {
        "status": "ok",
        "service": "viewer3d",
        "spa_ready": spa_ready,
        "ocr_ready": ocr_ready,
    }


def has_detected_room_names(rooms: list) -> bool:
    for room in rooms:
        name = str(room.get("room_name") or "").strip()
        if name and not name.startswith("class_"):
            return True
    return False


def apply_ocr_display_names(rooms: list, ocr_result: dict):
    """Use high-confidence OCR labels for display without changing SPA results."""
    for item in ocr_result.get("items", []):
        text = str(item.get("text") or "").strip().replace(" ", "")
        confidence = float(item.get("detector_confidence") or 0)
        bbox = item.get("bbox") or []

        # SPA numbers bedrooms by geometry. OCR is only used where it provides
        # a distinct semantic name that SPA cannot represent, such as 안방.
        if text != "안방" or confidence < 0.75 or len(bbox) < 3:
            continue

        try:
            center_x = sum(float(point[0]) for point in bbox) / len(bbox)
            center_y = sum(float(point[1]) for point in bbox) / len(bbox)
        except (TypeError, ValueError, IndexError):
            continue

        candidates = []
        for room in rooms:
            room_bbox = room.get("bbox") or {}
            x = float(room_bbox.get("x", 0))
            y = float(room_bbox.get("y", 0))
            width = float(room_bbox.get("width", 0))
            height = float(room_bbox.get("height", 0))
            if (
                room.get("class_id") == 5
                and x <= center_x <= x + width
                and y <= center_y <= y + height
            ):
                candidates.append((width * height, room))

        if candidates:
            _, matched_room = min(candidates, key=lambda candidate: candidate[0])
            matched_room["spa_room_name"] = matched_room.get("room_name")
            matched_room["room_name"] = "안방"
            matched_room["display_name"] = "안방"
            matched_room["display_name_source"] = "ocr"
            matched_room["ocr_anchor"] = [
                int(round(center_x)),
                int(round(center_y)),
            ]


def extract_room_polygons(original_content: bytes, visual_content: bytes, room_count: int):
    original = np.asarray(Image.open(io.BytesIO(original_content)).convert("RGB"))
    visual = np.asarray(Image.open(io.BytesIO(visual_content)).convert("RGB"))
    if original.shape != visual.shape:
        raise ValueError("SPA 시각화 이미지 크기가 원본과 다릅니다.")

    original_float = original.astype(np.float32)
    polygons_by_room = []
    kernel = np.ones((3, 3), np.uint8)

    for index in range(room_count):
        color = DISPLAY_COLORS[index % len(DISPLAY_COLORS)].astype(np.float32)
        expected = (original_float * 0.35 + color * 0.65).astype(np.uint8)
        difference = np.max(
            np.abs(visual.astype(np.int16) - expected.astype(np.int16)),
            axis=2,
        )
        room_mask = (difference <= 2).astype(np.uint8) * 255
        room_mask = cv2.morphologyEx(room_mask, cv2.MORPH_CLOSE, kernel)

        contours, _ = cv2.findContours(
            room_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        room_polygons = []
        for contour in contours:
            if cv2.contourArea(contour) < 80:
                continue
            perimeter = cv2.arcLength(contour, True)
            simplified = cv2.approxPolyDP(contour, max(1.5, perimeter * 0.0025), True)
            points = [[int(point[0][0]), int(point[0][1])] for point in simplified]
            if len(points) >= 3:
                room_polygons.append(points)

        room_polygons.sort(
            key=lambda polygon: abs(cv2.contourArea(np.array(polygon, dtype=np.int32))),
            reverse=True,
        )
        distance_map = cv2.distanceTransform(room_mask, cv2.DIST_L2, 5)
        _, interior_radius, _, interior_anchor = cv2.minMaxLoc(distance_map)
        polygons_by_room.append(
            {
                "polygons": room_polygons[:4],
                "interior_anchor": [int(interior_anchor[0]), int(interior_anchor[1])],
                "interior_radius": float(interior_radius),
            }
        )

    return polygons_by_room


def detect_wall_segments(original_content: bytes, rooms: list):
    image = cv2.imdecode(np.frombuffer(original_content, np.uint8), cv2.IMREAD_GRAYSCALE)
    if image is None or not rooms:
        return [], []

    room_boxes = [room.get("bbox") or {} for room in rooms if room.get("bbox")]
    if not room_boxes:
        return [], []

    margin = max(24, int(min(image.shape[:2]) * 0.008))
    x1 = max(0, min(int(box.get("x", 0)) for box in room_boxes) - margin)
    y1 = max(0, min(int(box.get("y", 0)) for box in room_boxes) - margin)
    x2 = min(
        image.shape[1],
        max(int(box.get("x", 0)) + int(box.get("width", 0)) for box in room_boxes)
        + margin,
    )
    y2 = min(
        image.shape[0],
        max(int(box.get("y", 0)) + int(box.get("height", 0)) for box in room_boxes)
        + margin,
    )
    roi = image[y1:y2, x1:x2]
    if roi.size == 0:
        return [], []

    dark = cv2.threshold(roi, 115, 255, cv2.THRESH_BINARY_INV)[1]
    dark = cv2.morphologyEx(
        dark, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8), iterations=1
    )
    min_line = max(40, int(min(roi.shape[:2]) * 0.025))
    lines = cv2.HoughLinesP(
        dark,
        1,
        np.pi / 180,
        threshold=max(35, min_line // 2),
        minLineLength=min_line,
        maxLineGap=max(7, min_line // 8),
    )
    if lines is None:
        return [], []

    horizontal = []
    vertical = []
    for raw_line in lines[:, 0]:
        lx1, ly1, lx2, ly2 = [int(value) for value in raw_line]
        dx = lx2 - lx1
        dy = ly2 - ly1
        length = float(np.hypot(dx, dy))
        if length < min_line:
            continue
        if abs(dy) <= max(3, abs(dx) * 0.10):
            horizontal.append(
                {
                    "coord": (ly1 + ly2) / 2 + y1,
                    "start": min(lx1, lx2) + x1,
                    "end": max(lx1, lx2) + x1,
                    "length": length,
                }
            )
        elif abs(dx) <= max(3, abs(dy) * 0.10):
            vertical.append(
                {
                    "coord": (lx1 + lx2) / 2 + x1,
                    "start": min(ly1, ly2) + y1,
                    "end": max(ly1, ly2) + y1,
                    "length": length,
                }
            )
    return horizontal, vertical


def nearest_wall_coordinate(lines: list, coordinate: float, span_start: float, span_end: float, tolerance: float):
    candidates = []
    low, high = sorted((span_start, span_end))
    for line in lines:
        overlap = min(high, line["end"]) - max(low, line["start"])
        if overlap < max(8, (high - low) * 0.18):
            continue
        distance = abs(float(line["coord"]) - coordinate)
        if distance <= tolerance:
            candidates.append((distance, -line["length"], float(line["coord"])))
    return min(candidates)[2] if candidates else coordinate


def remove_redundant_polygon_points(points: list):
    cleaned = []
    for point in points:
        candidate = [int(round(point[0])), int(round(point[1]))]
        if not cleaned or candidate != cleaned[-1]:
            cleaned.append(candidate)
    if len(cleaned) > 1 and cleaned[0] == cleaned[-1]:
        cleaned.pop()

    changed = True
    while changed and len(cleaned) >= 4:
        changed = False
        for index in range(len(cleaned)):
            previous = cleaned[index - 1]
            current = cleaned[index]
            following = cleaned[(index + 1) % len(cleaned)]
            same_x = abs(previous[0] - current[0]) <= 7 and abs(current[0] - following[0]) <= 7
            same_y = abs(previous[1] - current[1]) <= 7 and abs(current[1] - following[1]) <= 7
            if same_x or same_y:
                cleaned.pop(index)
                changed = True
                break
    return cleaned


def polygon_area(points: list):
    if len(points) < 3:
        return 0.0
    contour = np.array(points, dtype=np.int32).reshape((-1, 1, 2))
    return abs(cv2.contourArea(contour))


def point_to_segment_distance(point, start, end):
    point = np.asarray(point, dtype=np.float64)
    start = np.asarray(start, dtype=np.float64)
    end = np.asarray(end, dtype=np.float64)
    segment = end - start
    length_squared = float(np.dot(segment, segment))
    if length_squared <= 1e-6:
        return float(np.linalg.norm(point - start))
    ratio = float(np.dot(point - start, segment) / length_squared)
    ratio = max(0.0, min(1.0, ratio))
    projection = start + ratio * segment
    return float(np.linalg.norm(point - projection))


def flatten_small_rectilinear_doglegs(points: list, image_size: tuple, reference_area: float):
    """Straighten only very small rectangular teeth in viewer polygons.

    A tooth has five consecutive axis-aligned edges: along the wall, a short
    step away from it, a short bridge, a step back, then along the same wall.
    Door openings are protected by strict depth, width and area-change limits.
    """
    cleaned = [list(point) for point in points]
    depth_limit = max(5.0, min(16.0, min(image_size) * 0.0045))
    width_limit = max(18.0, min(60.0, min(image_size) * 0.018))

    def edge_axis(start, end):
        dx = float(end[0] - start[0])
        dy = float(end[1] - start[1])
        if abs(dx) >= max(3.0, abs(dy) * 3.0):
            return "h"
        if abs(dy) >= max(3.0, abs(dx) * 3.0):
            return "v"
        return None

    changed = False
    while len(cleaned) >= 6:
        replacement = None
        for start_index in range(len(cleaned)):
            rotated = cleaned[start_index:] + cleaned[:start_index]
            p0, p1, p2, p3, p4, p5 = rotated[:6]
            axes = [
                edge_axis(p0, p1),
                edge_axis(p1, p2),
                edge_axis(p2, p3),
                edge_axis(p3, p4),
                edge_axis(p4, p5),
            ]
            baseline_axis = axes[0]
            if baseline_axis not in {"h", "v"}:
                continue
            perpendicular_axis = "v" if baseline_axis == "h" else "h"
            if axes != [
                baseline_axis,
                perpendicular_axis,
                baseline_axis,
                perpendicular_axis,
                baseline_axis,
            ]:
                continue

            if baseline_axis == "h":
                baseline_gap = abs(float(p1[1] - p4[1]))
                bridge_gap = abs(float(p2[1] - p3[1]))
                depth = abs((float(p2[1] + p3[1])) / 2.0 - (float(p1[1] + p4[1])) / 2.0)
                width = abs(float(p3[0] - p2[0]))
                direction_values = [p1[0] - p0[0], p3[0] - p2[0], p5[0] - p4[0]]
            else:
                baseline_gap = abs(float(p1[0] - p4[0]))
                bridge_gap = abs(float(p2[0] - p3[0]))
                depth = abs((float(p2[0] + p3[0])) / 2.0 - (float(p1[0] + p4[0])) / 2.0)
                width = abs(float(p3[1] - p2[1]))
                direction_values = [p1[1] - p0[1], p3[1] - p2[1], p5[1] - p4[1]]

            if baseline_gap > 4.0 or bridge_gap > 4.0:
                continue
            if not 2.0 <= depth <= depth_limit or not 2.0 <= width <= width_limit:
                continue
            if any(value == 0 for value in direction_values):
                continue
            if not all(value > 0 for value in direction_values) and not all(
                value < 0 for value in direction_values
            ):
                continue

            trial = rotated[:2] + rotated[4:]
            trial_area = polygon_area(trial)
            area_delta = abs(trial_area - reference_area) / max(reference_area, 1.0)
            if area_delta > 0.003:
                continue
            replacement = trial
            break

        if replacement is None:
            break
        cleaned = remove_redundant_polygon_points(replacement)
        changed = True

    return cleaned, changed


def clean_viewer_micro_notches(polygon: list, image_size: tuple):
    """Remove only tiny display-only spikes while preserving room area and openings."""
    original = remove_redundant_polygon_points(polygon)
    if len(original) < 5:
        return original, False

    original_area = polygon_area(original)
    if original_area < 80:
        return original, False

    short_limit = max(4.0, min(12.0, min(image_size) * 0.0032))
    points = [list(point) for point in original]
    changed = False

    # A small mask/line mismatch commonly produces one short tooth between two
    # otherwise straight wall segments. Removing only vertices close to the
    # direct neighbouring segment keeps real door openings and large recesses.
    while len(points) > 4:
        best = None
        for index in range(len(points)):
            previous = points[index - 1]
            current = points[index]
            following = points[(index + 1) % len(points)]
            previous_length = float(np.linalg.norm(np.subtract(current, previous)))
            following_length = float(np.linalg.norm(np.subtract(following, current)))
            if min(previous_length, following_length) > short_limit * 2.25:
                continue

            deviation = point_to_segment_distance(current, previous, following)
            if deviation > short_limit:
                continue

            trial = points[:index] + points[index + 1 :]
            trial_area = polygon_area(trial)
            area_delta = abs(trial_area - original_area) / max(original_area, 1.0)
            if area_delta > 0.01:
                continue

            score = (deviation, min(previous_length, following_length), area_delta)
            if best is None or score < best[0]:
                best = (score, trial)

        if best is None:
            break
        points = best[1]
        changed = True

    cleaned = remove_redundant_polygon_points(points)
    cleaned, dogleg_changed = flatten_small_rectilinear_doglegs(
        cleaned, image_size, original_area
    )
    changed = changed or dogleg_changed
    cleaned_area = polygon_area(cleaned)
    if (
        len(cleaned) < 4
        or cleaned_area < 80
        or abs(cleaned_area - original_area) / max(original_area, 1.0) > 0.01
    ):
        return original, False
    return cleaned, changed


def align_polygon_to_walls(polygon: list, horizontal: list, vertical: list, image_size: tuple):
    contour = np.array(polygon, dtype=np.int32).reshape((-1, 1, 2))
    if len(contour) < 4:
        return None
    original_area = abs(cv2.contourArea(contour))
    if original_area < 80:
        return None

    perimeter = cv2.arcLength(contour, True)
    simplified = cv2.approxPolyDP(
        contour, max(2.5, perimeter * 0.0065), True
    ).reshape((-1, 2)).astype(np.float64)
    if len(simplified) < 4:
        return None

    tolerance = max(9, min(24, min(image_size) * 0.006))
    horizontal_targets = {}
    vertical_targets = {}
    count = len(simplified)

    for index in range(count):
        start = simplified[index]
        end = simplified[(index + 1) % count]
        dx = float(end[0] - start[0])
        dy = float(end[1] - start[1])
        if abs(dx) >= max(12, abs(dy) * 3):
            coordinate = float(start[1] + end[1]) / 2
            horizontal_targets[index] = nearest_wall_coordinate(
                horizontal, coordinate, start[0], end[0], tolerance
            )
        elif abs(dy) >= max(12, abs(dx) * 3):
            coordinate = float(start[0] + end[0]) / 2
            vertical_targets[index] = nearest_wall_coordinate(
                vertical, coordinate, start[1], end[1], tolerance
            )

    aligned = simplified.copy()
    for index in range(count):
        previous_edge = (index - 1) % count
        if previous_edge in vertical_targets:
            aligned[index][0] = vertical_targets[previous_edge]
        elif index in vertical_targets:
            aligned[index][0] = vertical_targets[index]
        if previous_edge in horizontal_targets:
            aligned[index][1] = horizontal_targets[previous_edge]
        elif index in horizontal_targets:
            aligned[index][1] = horizontal_targets[index]

    cleaned = remove_redundant_polygon_points(aligned.tolist())
    if len(cleaned) < 4:
        return None
    aligned_contour = np.array(cleaned, dtype=np.int32).reshape((-1, 1, 2))
    aligned_area = abs(cv2.contourArea(aligned_contour))
    area_ratio = aligned_area / max(original_area, 1)
    if not 0.88 <= area_ratio <= 1.12 or not cv2.isContourConvex(
        cv2.convexHull(aligned_contour)
    ):
        return None
    return cleaned


def add_wall_aligned_viewer_polygons(original_content: bytes, rooms: list):
    image = cv2.imdecode(np.frombuffer(original_content, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        return {"aligned_rooms": 0, "total_rooms": len(rooms)}
    horizontal, vertical = detect_wall_segments(original_content, rooms)
    if len(horizontal) < 3 or len(vertical) < 3:
        return {"aligned_rooms": 0, "total_rooms": len(rooms)}

    aligned_rooms = 0
    micro_cleaned_rooms = 0
    micro_cleaned_polygons = 0
    for room in rooms:
        aligned_polygons = []
        room_micro_cleaned = False
        for polygon in room.get("polygons", []):
            aligned = align_polygon_to_walls(
                polygon, horizontal, vertical, image.shape[:2]
            )
            display_polygon, polygon_cleaned = clean_viewer_micro_notches(
                aligned or polygon, image.shape[:2]
            )
            aligned_polygons.append(display_polygon)
            if polygon_cleaned:
                room_micro_cleaned = True
                micro_cleaned_polygons += 1
        if aligned_polygons and any(
            aligned != original
            for aligned, original in zip(aligned_polygons, room.get("polygons", []))
        ):
            room["viewer_polygons"] = aligned_polygons
            room["viewer_geometry_source"] = (
                "wall_aligned_micro_cleaned"
                if room_micro_cleaned
                else "wall_aligned"
            )
            aligned_rooms += 1
        if room_micro_cleaned:
            micro_cleaned_rooms += 1
    return {
        "aligned_rooms": aligned_rooms,
        "total_rooms": len(rooms),
        "micro_cleaned_rooms": micro_cleaned_rooms,
        "micro_cleaned_polygons": micro_cleaned_polygons,
        "horizontal_wall_candidates": len(horizontal),
        "vertical_wall_candidates": len(vertical),
    }


@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):
    if file.content_type not in {"image/jpeg", "image/png"}:
        raise HTTPException(415, "PNG 또는 JPG 평면도만 사용할 수 있습니다.")

    content = await file.read()
    try:
        json_response = requests.post(
            f"{SPA_URL}/segment",
            files={"file": (file.filename or "floorplan.png", content, file.content_type)},
            data={
                "model_type": "FP",
                "result_type": "room_json",
                "straighten_boundaries": "true",
            },
            timeout=240,
        )
    except requests.RequestException as exc:
        raise HTTPException(503, "SPA 분석 서비스에 연결할 수 없습니다.") from exc

    if not json_response.ok:
        raise HTTPException(json_response.status_code, json_response.text[:500])

    try:
        result = json_response.json()
    except json.JSONDecodeError as exc:
        raise HTTPException(502, "SPA 결과를 읽을 수 없습니다.") from exc

    try:
        if result.get("rooms"):
            # SPA room_json already contains polygons derived from the same
            # inference masks, so a second SPA inference is unnecessary.
            result["viewer_single_spa_inference"] = True
        result["viewer_wall_postprocess"] = add_wall_aligned_viewer_polygons(
            content, result.get("rooms", [])
        )
    except (OSError, ValueError, cv2.error):
        # 외곽선 추출에 실패해도 기존 bbox 3D 미리보기는 계속 제공한다.
        pass

    # SPA room_json already performs OCR enrichment. Do not repeat the slowest
    # dependency call after segmentation has already produced usable geometry.

    result["viewer_note"] = (
        "원본 AI Hub 모델은 수정하지 않았으며, SPA 실제 픽셀 외곽선을 3D로 시각화한 미리보기입니다."
    )
    return result
