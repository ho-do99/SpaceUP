import asyncio
import io

from PIL import Image
from starlette.datastructures import Headers, UploadFile

from app import main


class SpaResponse:
    ok = True

    def raise_for_status(self):
        return None

    def json(self):
        return {
            "image_width": 64,
            "image_height": 64,
            "total_area_pixel_count": 100,
            "rooms": [
                {
                    "room_name": "living room",
                    "class_id": 4,
                    "pixel_count": 100,
                    "included_in_total_area": True,
                }
            ],
        }


def test_analyze_does_not_repeat_ocr_after_spa_room_json(monkeypatch):
    calls = []

    def post(url, **_kwargs):
        calls.append(url)
        return SpaResponse()

    monkeypatch.setattr(main.requests, "post", post)
    image = Image.new("RGB", (64, 64), "white")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    upload = UploadFile(
        file=io.BytesIO(buffer.getvalue()),
        filename="floorplan.png",
        headers=Headers({"content-type": "image/png"}),
    )

    asyncio.run(main.analyze(upload))

    assert calls == [f"{main.SPA_URL}/segment"]
