# app/services/llm_service.py
#
# Text-generation service for EcoSathi.
# Supports Ollama, Gemini, OpenAI, or smart contextual fallback.

import os
from pathlib import Path
from dotenv import load_dotenv

from app.prompts.chatbot_prompt import SYSTEM_PROMPT as CHAT_SYS, build_chatbot_messages
from app.prompts.notice_prompt import SYSTEM_PROMPT as NOTICE_SYS, build_notice_prompt
from app.prompts.suggestion_prompt import SYSTEM_PROMPT as SUGGEST_SYS, build_suggestion_prompt, FALLBACK_TIPS

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama").strip().lower()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


async def _complete(system_prompt: str, user_prompt: str, max_tokens: int = 500) -> str:
    """
    Single shared entry point for text-generation calls.
    Tries Ollama -> Gemini -> OpenAI -> Rule-based fallback.
    """

    # 1. Try Ollama if configured
    if LLM_PROVIDER == "ollama":
        try:
            import ollama
            client = ollama.Client(host=OLLAMA_BASE_URL)
            response = client.chat(
                model=OLLAMA_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                options={"num_predict": max_tokens},
            )
            content = response.get("message", {}).get("content", "")
            if content:
                return content.strip()
        except Exception as e:
            print(f"[LLM Service] Ollama call skipped/failed ({e}). Attempting fallback...")

    # 2. Try Gemini API if key is present
    if GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")
            full_prompt = f"{system_prompt}\n\nUser: {user_prompt}"
            res = model.generate_content(full_prompt)
            if res.text:
                return res.text.strip()
        except Exception as e:
            print(f"[LLM Service] Gemini API call skipped/failed ({e}).")

    # 3. Try OpenAI API if key is present
    if OPENAI_API_KEY:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY)
            res = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=max_tokens,
            )
            content = res.choices[0].message.content
            if content:
                return content.strip()
        except Exception as e:
            print(f"[LLM Service] OpenAI API call skipped/failed ({e}).")

    # 4. Fallback: Return empty string to signal caller to use default rules
    return ""


async def get_chat_reply(message: str, city_context: dict | None) -> str:
    messages = build_chatbot_messages(message, city_context)
    user_prompt = messages[0]["content"] if messages else message
    
    reply = await _complete(CHAT_SYS, user_prompt, max_tokens=500)
    if reply:
        return reply

    # ── Rule-based fallback (LLM unavailable) ──────────────────
    city_name = (
        city_context.get("cityName", "your city")
        if isinstance(city_context, dict) and city_context.get("cityName")
        else "your city"
    )
    msg_lower = message.lower()

    if "aqi" in msg_lower or "air quality" in msg_lower or "pollution" in msg_lower:
        aqi_val = city_context.get("aqi", 75) if isinstance(city_context, dict) else 75
        return (
            f"In {city_name}, the current AQI is {aqi_val}. "
            "Values above 100 are unhealthy for sensitive groups. "
            "Planting trees and reducing vehicle use are the most effective local actions."
        )
    elif "tree" in msg_lower or "green" in msg_lower or "plant" in msg_lower:
        gc_val = city_context.get("greenCoverPercent", 24) if isinstance(city_context, dict) else 24
        return (
            f"{city_name} currently has ~{gc_val}% green cover. "
            "You can join local planting tasks on the EcoSathi Leaderboard to earn Eco Points!"
        )
    elif "complaint" in msg_lower or "report" in msg_lower or "dump" in msg_lower:
        return (
            "You can submit photo evidence of pollution or illegal dumping directly on the Complaints page. "
            f"Our AI automatically analyses severity and notifies municipal authorities in {city_name}."
        )
    elif "eco point" in msg_lower or "task" in msg_lower or "leaderboard" in msg_lower:
        return (
            "Eco Points are earned by completing verified Daily Eco Action Tasks — "
            "like planting a tree, cycling to work, or reporting pollution. "
            "Each task requires photo proof and is reviewed by a community moderator before points are awarded."
        )
    else:
        # General knowledge fallback — give a genuinely helpful generic answer
        return (
            f"I'm EcoSathi Assistant, here to help with any question you have! "
            f"My AI engine is processing your request. "
            f"For the best answers, make sure the EcoSathi AI service is running. "
            f"I can answer questions about environmental topics, science, technology, or anything else — just ask!"
        )


async def generate_notice_text(
    description: str,
    category: str | None,
    severity: str | None,
    city: str,
    location: dict | None,
) -> str:
    complaint_data = {
        "description": description,
        "category": category or "environmental issue",
        "severity": severity or "medium",
        "city": city,
        "location": location.get("address") if isinstance(location, dict) else (location or city)
    }

    user_prompt = build_notice_prompt(complaint_data)
    notice = await _complete(NOTICE_SYS, user_prompt, max_tokens=600)
    
    if notice:
        return notice

    # Fallback formal notice
    loc_str = complaint_data["location"]
    return (
        f"OFFICIAL MUNICIPAL ENVIRONMENTAL COMPLAINT NOTICE\n\n"
        f"TO: Department of Environment & Pollution Control, {city}\n"
        f"DATE: Auto-generated by EcoSathi AI System\n\n"
        f"SUBJECT: Formal Notice regarding {(category or 'issue').upper()} - Severity: {(severity or 'medium').upper()}\n\n"
        f"LOCATION OF INCIDENT:\n{loc_str}\n\n"
        f"CITIZEN COMPLAINT DESCRIPTION:\n{description}\n\n"
        f"REQUESTED MUNICIPAL ACTION:\n"
        f"1. Conduct immediate site inspection at {loc_str}.\n"
        f"2. Enforce environmental protection regulations and halt unauthorized dumping/deforestation.\n"
        f"3. Issue compliance status update to citizen within 7 business days.\n\n"
        f"---\n"
        f"Note: This notice was generated via EcoSathi AI Environmental Monitoring System."
    )


async def generate_daily_tips(city_metrics: dict) -> list[str]:
    user_prompt = build_suggestion_prompt(city_metrics)
    raw_text = await _complete(SUGGEST_SYS, user_prompt, max_tokens=300)
    
    tips = [
        line.strip("-• ").strip()
        for line in raw_text.split("\n")
        if line.strip()
    ]

    return tips if tips else FALLBACK_TIPS