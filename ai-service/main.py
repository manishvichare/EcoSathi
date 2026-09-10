
# FastAPI entrypoint. Mounts all 5 AI feature routers.
# Per the doc: "The frontend never talks to the AI service directly — all
# AI requests are proxied through the backend" — so CORS here only needs
# to allow the Node backend's origin, not the frontend's.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.routers import chatbot, complaint_analysis, notice_generator, suggestions, prediction

load_dotenv()  # reads ai-service/.env

BACKEND_ORIGIN = os.getenv("BACKEND_ORIGIN", "http://localhost:5000")

app = FastAPI(
    title="EcoSathi AI Service",
    description="Python FastAPI microservice for chatbot, complaint severity analysis, "
                 "notice generation, eco-suggestions, and trend prediction.",
    version="1.0.0",
)

# Only the Node backend should be allowed to call this service directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=[BACKEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ecosathi-ai-service"}


# ── Route mounting (matches API contract section 5 of the architecture doc) ──
app.include_router(complaint_analysis.router, tags=["Complaint Analysis"])  # POST /analyze-complaint
app.include_router(notice_generator.router, tags=["Notice Generation"])     # POST /generate-notice
app.include_router(suggestions.router, tags=["Daily Suggestions"])          # POST /daily-suggestion
app.include_router(prediction.router, tags=["Trend Prediction"])            # POST /predict-trend
app.include_router(chatbot.router, tags=["Chatbot"])                        # POST /chat