# app/routers/complaint_analysis.py
# POST /analyze-complaint
# Receives: image (file) + description (text) + category (text) — multipart/form-data,
# forwarded by Node backend's complaintController.js
# Returns: { is_valid, matches_category, severity, category, detected_category, detected_content, summary, rejection_reason }

from fastapi import APIRouter, UploadFile, File, Form
from app.services import vision_service

router = APIRouter()


@router.post("/analyze-complaint")
async def analyze_complaint(
    image: UploadFile = File(...),
    description: str = Form(...),
    category: str = Form("other"),
):
    result = await vision_service.analyze_image(image, description, category)

    return {
        "is_valid": result.get("is_valid", False),
        "matches_category": result.get("matches_category", False),
        "severity": result.get("severity"),
        "category": result.get("category", category),
        "detected_category": result.get("detected_category"),
        "detected_content": result.get("detected_content"),
        "summary": result.get("summary", ""),
        "rejection_reason": result.get("rejection_reason"),
    }