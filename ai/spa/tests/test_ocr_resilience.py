import sys
import types

import requests
import pytest
from fastapi import HTTPException

sys.modules.setdefault("torch", types.ModuleType("torch"))

from app import main


class SuccessfulOcrResponse:
    def raise_for_status(self):
        return None

    def json(self):
        return {
            "width": 1200,
            "height": 800,
            "items": [
                {
                    "text": "\uac70\uc2e4",
                    "detector_confidence": 0.93,
                    "bbox": [[400, 300], [500, 300], [500, 340], [400, 340]],
                }
            ],
        }


def test_transient_ocr_connection_failure_retries_and_keeps_room_name(monkeypatch):
    calls = 0
    sleeps = []

    def recovering_ocr(*_args, **_kwargs):
        nonlocal calls
        calls += 1
        if calls == 1:
            raise requests.ConnectionError("ocr container is still loading")
        return SuccessfulOcrResponse()

    monkeypatch.setattr(main.requests, "post", recovering_ocr)
    monkeypatch.setattr(main.time, "sleep", sleeps.append)

    labels = main.ocr_room_labels(
        b"floorplan-image",
        "image/png",
        (1200, 800),
    )

    assert calls == 2
    assert sleeps == [main.OCR_RETRY_DELAY_SECONDS]
    assert [label["room_name"] for label in labels] == ["\uac70\uc2e4"]


def test_final_ocr_connection_failure_stops_unnamed_room_analysis(monkeypatch):
    calls = 0

    def unavailable_ocr(*_args, **_kwargs):
        nonlocal calls
        calls += 1
        raise requests.ConnectionError("ocr container never became ready")

    monkeypatch.setattr(main.requests, "post", unavailable_ocr)

    with pytest.raises(HTTPException) as error:
        main.ocr_room_labels(
            b"floorplan-image",
            "image/png",
            (1200, 800),
        )

    assert calls == 2
    assert error.value.status_code == 503


def test_ocr_client_error_is_not_retried_or_rewritten(monkeypatch):
    calls = 0

    class InvalidImageResponse:
        status_code = 422

        def raise_for_status(self):
            raise requests.HTTPError("invalid image", response=self)

    def invalid_image(*_args, **_kwargs):
        nonlocal calls
        calls += 1
        return InvalidImageResponse()

    monkeypatch.setattr(main.requests, "post", invalid_image)

    with pytest.raises(HTTPException) as error:
        main.ocr_room_labels(b"invalid", "image/png", (1200, 800))

    assert calls == 1
    assert error.value.status_code == 422


def test_successful_ocr_without_known_room_names_is_not_accepted(monkeypatch):
    class UnknownTextResponse(SuccessfulOcrResponse):
        def json(self):
            result = super().json()
            result["items"][0]["text"] = "101\ub3d9"
            return result

    monkeypatch.setattr(
        main.requests,
        "post",
        lambda *_args, **_kwargs: UnknownTextResponse(),
    )

    labels = main.ocr_room_labels(
        b"floorplan-image",
        "image/png",
        (1200, 800),
    )

    assert labels == []

    with pytest.raises(HTTPException) as error:
        main.require_detected_room_names([{"room_name": "class_4_1"}])

    assert error.value.status_code == 422

    main.require_detected_room_names([{"room_name": "W.I.C"}])
