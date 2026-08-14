import requests

from app import main


def test_ocr_connection_failure_keeps_segmentation_available(monkeypatch):
    def unavailable_ocr(*_args, **_kwargs):
        raise requests.ConnectionError("ocr container restarted during first inference")

    monkeypatch.setattr(main.requests, "post", unavailable_ocr)

    labels = main.ocr_room_labels(
        b"floorplan-image",
        "image/png",
        (1200, 800),
    )

    assert labels == []
