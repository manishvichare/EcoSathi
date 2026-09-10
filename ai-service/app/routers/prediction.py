# app/routers/prediction.py
# POST /predict-trend
# Receives: historicalData (array of past daily health scores)
# Returns: { predictedScore, trend }

from fastapi import APIRouter
from app.models.schemas import PredictionRequest, PredictionResponse
from app.services import prediction_service

router = APIRouter()


@router.post("/predict-trend", response_model=PredictionResponse)
async def predict_trend(payload: PredictionRequest):
    result = prediction_service.predict(payload.historicalData)

    return PredictionResponse(
        predictedScore=result["predictedScore"],
        trend=result["trend"],  # "improving" | "declining" | "stable"
    )