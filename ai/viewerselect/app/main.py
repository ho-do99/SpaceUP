"""Port 8003: mobile-friendly room selection UI backed by the 8004 engine."""

from pathlib import Path

from fastapi.responses import FileResponse
from starlette.routing import Route

from wall_app import main as wall


STATIC_DIR = Path(__file__).resolve().parent / "static"


async def selection_index(_request):
    return FileResponse(
        STATIC_DIR / "index.html",
        headers={"Cache-Control": "no-store"},
    )


async def selection_styles(_request):
    return FileResponse(
        STATIC_DIR / "styles.css",
        media_type="text/css",
        headers={"Cache-Control": "no-store"},
    )


async def selection_javascript(_request):
    return FileResponse(
        STATIC_DIR / "selection.js",
        media_type="application/javascript",
        headers={"Cache-Control": "no-store"},
    )


# 기존 8003 첫 화면 대신 공간 선택 화면을 가장 먼저 연결합니다.
wall.app.router.routes.insert(
    0, Route("/selection/selection.js", selection_javascript, methods=["GET"])
)
wall.app.router.routes.insert(
    0, Route("/selection/styles.css", selection_styles, methods=["GET"])
)
wall.app.router.routes.insert(0, Route("/", selection_index, methods=["GET"]))

wall.app.title = "SpaceUP Floor Plan Room Selector"
wall.app.version = "1.0.0"
app = wall.app
