from fastapi import APIRouter, File, HTTPException, UploadFile, status

from ..services.ocr_service import extract_text
from ..services.segmentation_service import segment_rooms


router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def analyze_floor_plan(
    file: UploadFile = File(...),
) -> dict[str, str | list[str]]:
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded floor plan is empty.",
        )

    return {
        "filename": file.filename or "floor-plan",
        "status": "accepted",
        "ocr_text": extract_text(file_bytes),
        "rooms": segment_rooms(file_bytes),
    }
