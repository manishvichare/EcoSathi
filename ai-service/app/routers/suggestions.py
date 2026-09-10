# app/routers/suggestions.py
# POST /daily-suggestion
# Receives: cityMetrics (current AQI, green cover, health score, etc.)
# Returns: { tips: [...] }

from fastapi import APIRouter
from app.models.schemas import SuggestionRequest, SuggestionResponse
from app.services import llm_service

router = APIRouter()


@router.post("/daily-suggestion", response_model=SuggestionResponse)
async def daily_suggestion(payload: SuggestionRequest):
    tips = await llm_service.generate_daily_tips(city_metrics=payload.cityMetrics)

    return SuggestionResponse(tips=tips)