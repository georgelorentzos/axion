from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from dependencies import UPLOADS_FOLDER

router = APIRouter(prefix="/api", tags=["images"])

@router.get("/serve/image/{image_name}")
def serve_image(image_name: str):
    file_path = UPLOADS_FOLDER / image_name

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Image not found.")

    return FileResponse(path=str(file_path))
