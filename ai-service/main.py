
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

raw_origins = os.getenv("BACKEND_ORIGIN", "").split(",")
custom_origins = [o.strip().rstrip("/") for o in raw_origins if o.strip()]

allowed_origins = [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ecosathi.onrender.com",
    "https://eco-sathi-blue.vercel.app",
] + custom_origins

app = FastAPI(
    title="EcoSathi AI Service",
    description="Python FastAPI microservice for chatbot, complaint severity analysis, "
                 "notice generation, eco-suggestions, and trend prediction.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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