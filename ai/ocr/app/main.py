from __future__ import annotations

import io
import re
import sys
from collections import Counter
from enum import Enum
from functools import lru_cache
from pathlib import Path
from typing import List

import cv2
import numpy as np
import pytesseract
import torch
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from PIL import Image, ImageDraw, ImageFont
from pydantic import BaseModel
from torchvision.models import resnet18

AIHUB_ROOT = Path("/opt/aihub-ocr")
sys.path.insert(0, str(AIHUB_ROOT))

from OCREvaluation import (  # noqa: E402
    CRNN,
    correct_prediction,
    correct_word,
    decode_predictions,
    make_crnn_input,
)

app = FastAPI(title="SpaceUP AI Hub OCR API", version="1.0.0")

VOCABULARY = list(
    "갱토/덱설름축자벨f펌탈밀밭A접목R즐월팬입의식매서합맘메종콘총온정채건막카뒷α판애절책점베린척측승쓰회스트나패동펜약시창방홀이붙더제면탁어례놀남랙지향층키납울악근현머엌클통필쪽응용E임물,법침당진취든살락마확소일큰대커디초신주발력범P탕강무 녀조컨속변첫게단둘니련해거파갑레리프벽냉I촌증듈좌잔늘욕S영아데도투처실계간코로별준휴링열기요농업랑탱역툇표공숙넌후원에옥테집님감부고오(육램평타장출1+튜렛캐구환송활화손V경체템)노태튼겸&위및다압암급르닥룸관포복김모삭썬젠T블보유누알함짝광각중음비한연품생H상저박플란사탑선즈라.적래픈N텔청우택외번량국인수작뜰치안천분난내예샤팅바피씽닝문벤황배루겐터재독퍼획러a림드크운뮤티할세Y등L브명잭가워행횡센전개옷습형호차풍갤하반족페톡째붕양폰미-여본민"
)


class OCRText(BaseModel):
    text: str
    detector_confidence: float
    bbox: List[List[int]]


class OCRResponse(BaseModel):
    width: int
    height: int
    rotated: bool
    items: List[OCRText]


class OCRResultType(str, Enum):
    json = "json"
    annotated_image = "annotated_image"


FONT_PATH = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
NUMBERED_ROOM_NAMES = ("침실", "욕실", "발코니")


def _numbered_room_base(text: str) -> str | None:
    compact = re.sub(r"\s+", "", text)
    return next((name for name in NUMBERED_ROOM_NAMES if name in compact), None)


def _read_adjacent_room_number(
    image: np.ndarray,
    bbox: list[int],
    recognized_text: str,
) -> tuple[str, list[int]]:
    """Read a one-digit room suffix just to the right of an AI Hub OCR box.

    The pretrained CRNN vocabulary cannot emit digits 2-9.  We therefore keep
    its Korean room-name result and use a tightly bounded, digit-only OCR pass
    on the adjacent pixels.  A low-confidence result is ignored so dimension
    strings elsewhere in the drawing cannot rename a room.
    """
    base = _numbered_room_base(recognized_text)
    if base is None or re.search(r"[1-9]", recognized_text):
        return recognized_text, bbox

    image_height, image_width = image.shape[:2]
    x1, y1, x2, y2 = (int(value) for value in bbox)
    box_height = max(y2 - y1, 1)

    # Only inspect the immediate right-hand side.  Padding is tied to text
    # height rather than image size, making it stable across drawing scales.
    # The AI Hub detector box normally ends immediately before the numeric
    # suffix.  Reading the right part of the Korean word together with the
    # digit confuses Tesseract, so isolate only the narrow strip immediately
    # after the detector box.  A tiny overlap keeps antialiased digit strokes
    # that touch the detector boundary.
    roi_x2 = min(image_width, x2 + max(8, int(round(box_height * 1.40))))
    roi_y1 = max(0, y1 - max(2, int(round(box_height * 0.30))))
    roi_y2 = min(image_height, y2 + max(2, int(round(box_height * 0.30))))
    # Tesseract confidence is unstable for a single tiny glyph.  Instead,
    # inspect three almost-identical OpenCV crops and accept a digit only when
    # at least two crops agree.  This rejects nearby dimension symbols while
    # reliably recovering labels such as 침실1/2/3 and 욕실1/2.
    digit_votes: list[str] = []
    digit_candidates: list[np.ndarray] = []
    config = "--psm 10 -c tessedit_char_whitelist=123456789"
    for overlap_ratio in (0.0, 0.10, 0.20):
        roi_x1 = max(0, int(round(x2 - box_height * overlap_ratio)))
        roi = image[roi_y1:roi_y2, roi_x1:roi_x2]
        if roi.size == 0:
            continue
        gray = cv2.cvtColor(roi, cv2.COLOR_RGB2GRAY)
        # Six times enlargement was the most stable size for the thin labels
        # used in the supplied 59/84/118 m² drawings.
        scale = 6
        enlarged = cv2.resize(
            gray,
            None,
            fx=scale,
            fy=scale,
            interpolation=cv2.INTER_CUBIC,
        )
        digit_candidates.append(enlarged)
        token = pytesseract.image_to_string(
            enlarged,
            lang="eng",
            config=config,
        ).strip()
        # Border strokes can occasionally be returned together with the real
        # digit (for example "13").  Count each visible digit as one vote;
        # the true suffix repeats across the overlapping crops.
        digit_votes.extend(set(re.findall(r"[1-9]", token)))

    vote_counts = Counter(digit_votes)
    best_digit = None
    if vote_counts:
        candidate_digit, vote_count = vote_counts.most_common(1)[0]
        if vote_count >= 2:
            best_digit = candidate_digit

    # If only one crop saw the suffix, ask two alternative single-character
    # page modes to confirm it.  This fallback runs only for difficult labels.
    if best_digit is None:
        for candidate in digit_candidates:
            for page_mode in (7, 13):
                token = pytesseract.image_to_string(
                    candidate,
                    lang="eng",
                    config=(
                        f"--psm {page_mode} "
                        "-c tessedit_char_whitelist=123456789"
                    ),
                ).strip()
                digit_votes.extend(set(re.findall(r"[1-9]", token)))
        vote_counts = Counter(digit_votes)
        if vote_counts:
            candidate_digit, vote_count = vote_counts.most_common(1)[0]
            if vote_count >= 2:
                best_digit = candidate_digit

    if best_digit is None:
        return recognized_text, bbox

    compact = re.sub(r"\s+", "", recognized_text)
    refined_text = re.sub(re.escape(base), f"{base}{best_digit}", compact, count=1)
    refined_bbox = [x1, y1, roi_x2, y2]
    return refined_text, refined_bbox


@lru_cache(maxsize=1)
def engines():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    idx2char = {index: char for index, char in enumerate(VOCABULARY)}
    idx2char[len(idx2char)] = "@"

    crnn = CRNN(len(idx2char), resnet18(weights=None), rnn_hidden_size=256)
    crnn.load_state_dict(torch.load(AIHUB_ROOT / "model/OCR_crnn_pretrained.pt", map_location=device))
    crnn.to(device).eval()

    detector = torch.hub.load(
        str(AIHUB_ROOT / "yolov5"),
        "custom",
        str(AIHUB_ROOT / "model/OCR_yolov5_pretrained.pt"),
        source="local",
        _verbose=False,
    )
    detector.conf = 0.4
    detector.iou = 0.5
    return detector, crnn, device, idx2char


def read_image(content: bytes, rotate_clockwise: bool) -> np.ndarray:
    try:
        image = np.asarray(Image.open(io.BytesIO(content)).convert("RGB"))
    except Exception as exc:
        raise HTTPException(400, "JPG 또는 PNG 이미지를 올려주세요.") from exc
    height, width = image.shape[:2]
    image = image[: height // 32 * 32, : width // 32 * 32]
    if image.size == 0:
        raise HTTPException(400, "이미지의 가로와 세로는 각각 32픽셀 이상이어야 합니다.")
    return cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE) if rotate_clockwise else image


def annotated_response(image: np.ndarray, items: list[OCRText]):
    canvas = Image.fromarray(image).convert("RGB")
    draw = ImageDraw.Draw(canvas)
    font_size = max(18, min(36, canvas.width // 180))
    font = ImageFont.truetype(FONT_PATH, font_size)
    line_width = max(2, canvas.width // 1500)

    for index, item in enumerate(items, 1):
        xs = [point[0] for point in item.bbox]
        ys = [point[1] for point in item.bbox]
        x1, y1, x2, y2 = min(xs), min(ys), max(xs), max(ys)
        draw.rectangle((x1, y1, x2, y2), outline=(255, 0, 0), width=line_width)
        label = f"{index}. {item.text} ({item.detector_confidence:.2f})"
        text_box = draw.textbbox((0, 0), label, font=font)
        text_width = text_box[2] - text_box[0]
        text_height = text_box[3] - text_box[1]
        label_y = y1 - text_height - 6
        if label_y < 0:
            label_y = y2 + 4
        label_x = max(0, min(x1, canvas.width - text_width - 6))
        draw.rectangle(
            (label_x, label_y, label_x + text_width + 6, label_y + text_height + 6),
            fill=(255, 255, 0),
        )
        draw.text((label_x + 3, label_y + 1), label, fill=(0, 0, 0), font=font)

    buffer = io.BytesIO()
    canvas.save(buffer, format="PNG")
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="image/png",
        headers={"Content-Disposition": "inline; filename=ocr-annotated.png"},
    )


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ocr",
        "models_present": all((AIHUB_ROOT / "model" / name).is_file() for name in (
            "OCR_crnn_pretrained.pt", "OCR_yolov5_pretrained.pt")),
    }


@app.post("/ocr")
async def ocr(
    file: UploadFile = File(...),
    rotate_clockwise: bool = Form(False),
    result_type: OCRResultType = Form(OCRResultType.json),
):
    if file.content_type not in {"image/jpeg", "image/png"}:
        raise HTTPException(415, "JPG 또는 PNG만 지원합니다.")
    image = read_image(await file.read(), rotate_clockwise)
    height, width = image.shape[:2]
    detector, crnn, device, idx2char = engines()

    detections = detector(image, size=4960).pandas().xyxy[0]
    if detections.empty:
        empty = OCRResponse(width=width, height=height, rotated=rotate_clockwise, items=[])
        return annotated_response(image, []) if result_type == OCRResultType.annotated_image else empty
    detections[["xmin", "ymin", "xmax", "ymax"]] = (
        detections[["xmin", "ymin", "xmax", "ymax"]].apply(np.ceil).astype(int)
    )

    items: list[OCRText] = []
    with torch.inference_mode():
        for row in detections.itertuples(index=False):
            bbox = [row.xmin, row.ymin, row.xmax, row.ymax]
            _, tensor = make_crnn_input(bbox, image)
            logits = crnn(tensor.to(device))
            raw = decode_predictions(logits.cpu(), idx2char)[0]
            text = correct_word(correct_prediction(raw))

            # The original detector occasionally stops immediately before a
            # trailing "1".  Re-run the unchanged AI Hub recognizer once with
            # a slightly wider box; its vocabulary already contains digit 1.
            # Accept only the same room name plus 1, never an unrelated result.
            base = _numbered_room_base(text)
            if base is not None and not re.search(r"[1-9]", text):
                box_height = max(bbox[3] - bbox[1], 1)
                expanded_bbox = [
                    bbox[0],
                    bbox[1],
                    min(width, bbox[2] + max(4, int(round(box_height * 0.45)))),
                    bbox[3],
                ]
                _, expanded_tensor = make_crnn_input(expanded_bbox, image)
                expanded_logits = crnn(expanded_tensor.to(device))
                expanded_raw = decode_predictions(expanded_logits.cpu(), idx2char)[0]
                expanded_text = correct_word(correct_prediction(expanded_raw))
                expanded_compact = re.sub(r"\s+", "", expanded_text)
                if re.search(re.escape(base) + r"1", expanded_compact):
                    text = expanded_compact
                    bbox = expanded_bbox

            text, bbox = _read_adjacent_room_number(image, bbox, text)
            items.append(OCRText(
                text=text,
                detector_confidence=float(row.confidence),
                bbox=[[bbox[0], bbox[1]], [bbox[2], bbox[1]],
                      [bbox[2], bbox[3]], [bbox[0], bbox[3]]],
            ))
    if result_type == OCRResultType.annotated_image:
        return annotated_response(image, items)
    return OCRResponse(width=width, height=height, rotated=rotate_clockwise, items=items)
