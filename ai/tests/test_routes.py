from fastapi.testclient import TestClient

from ai.app.main import app


client = TestClient(app)


def test_health_returns_service_status() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "spaceup-ai",
    }


def test_analysis_accepts_a_floor_plan() -> None:
    response = client.post(
        "/analysis",
        files={"file": ("floor-plan.png", b"floor-plan-bytes", "image/png")},
    )

    assert response.status_code == 202
    assert response.json() == {
        "filename": "floor-plan.png",
        "status": "accepted",
        "ocr_text": "",
        "rooms": [],
    }


def test_analysis_rejects_an_empty_floor_plan() -> None:
    response = client.post(
        "/analysis",
        files={"file": ("empty.png", b"", "image/png")},
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Uploaded floor plan is empty."}
