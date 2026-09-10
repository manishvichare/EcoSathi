# app/models/schemas.py
# Pydantic request/response models for the AI service routers.
# Field names match the API contract in the architecture doc (section 5)
# and the payloads sent by the Node backend's aiClient.js.

from pydantic import BaseModel
from typing import List, Optional, Dict, Any


# ── /analyze-complaint ───────────────────────────────────
# (Not used as a request body — that endpoint receives multipart
# form-data via UploadFile/Form directly in the router. This response
# model documents the shape for reference / future response_model use.)
class ComplaintAnalysisResponse(BaseModel):
    severity: str   # "low" | "medium" | "high" | "critical"
    category: str   # e.g. "illegal dumping", "deforestation", "air pollution"
    summary: str


# ── /generate-notice ──────────────────────────────────────
class NoticeRequest(BaseModel):
    description: str
    category: Optional[str] = None
    severity: Optional[str] = None
    city: str
    location: Optional[Dict[str, Any]] = None  # { lat, lng, address }


class NoticeResponse(BaseModel):
    notice_text: str


# ── /daily-suggestion ─────────────────────────────────────
class SuggestionRequest(BaseModel):
    # Whatever the backend sends from EnvironmentData — kept flexible
    # since exact metric fields may evolve (aqi, greenCoverPercent, etc.)
    cityMetrics: Dict[str, Any]


class SuggestionResponse(BaseModel):
    tips: List[str]


# ── /predict-trend ────────────────────────────────────────
class HistoricalPoint(BaseModel):
    date: str
    healthScore: float


class PredictionRequest(BaseModel):
    historicalData: List[HistoricalPoint]


class PredictionResponse(BaseModel):
    predictedScore: float
    trend: str  # "improving" | "declining" | "stable"


# ── /chat ──────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    # cityContext can arrive as a plain string city name (e.g. "Pune") OR a full metrics dict.
    # We accept both via Union and normalise in the router.
    cityContext: Optional[Any] = None  # str | { city, aqi, greenCoverPercent, healthScore }

    def get_context_dict(self) -> Optional[Dict[str, Any]]:
        """Normalise cityContext to a dict or None."""
        if isinstance(self.cityContext, dict):
            return self.cityContext
        if isinstance(self.cityContext, str) and self.cityContext.strip():
            return {"cityName": self.cityContext.strip()}
        return None


class ChatResponse(BaseModel):
    reply: str