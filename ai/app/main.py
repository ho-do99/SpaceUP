from fastapi import FastAPI

from .routes.analysis import router as analysis_router
from .routes.health import router as health_router


app = FastAPI(
    title="SpaceUP AI",
    version="0.1.0",
    description="Floor-plan analysis service for SpaceUP.",
)

app.include_router(health_router)
app.include_router(analysis_router)
