# app/routers/notice_generator.py
# POST /generate-notice
# Receives: complaint data (description, category, severity, city, location)
# Returns: { notice_text }

from fastapi import APIRouter
from app.models.schemas import NoticeRequest, NoticeResponse
from app.services import llm_service

router = APIRouter()


@router.post("/generate-notice", response_model=NoticeResponse)
async def generate_notice(payload: NoticeRequest):
    notice_text = await llm_service.generate_notice_text(
        description=payload.description,
        category=payload.category,
        severity=payload.severity,
        city=payload.city,
        location=payload.location,
    )

    return NoticeResponse(notice_text=notice_text)