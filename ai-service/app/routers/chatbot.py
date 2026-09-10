# app/routers/chatbot.py
# POST /chat
# Receives: message (user's question) + cityContext (live AQI/green cover/health score)
# Returns: { reply }

from fastapi import APIRouter
from app.models.schemas import ChatRequest, ChatResponse
from app.services import llm_service

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    reply = await llm_service.get_chat_reply(
        message=payload.message,
        city_context=payload.get_context_dict(),
    )

    return ChatResponse(reply=reply)