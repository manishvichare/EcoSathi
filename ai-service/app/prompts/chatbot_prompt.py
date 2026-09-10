# ai-service/app/prompts/chatbot_prompt.py
"""
Prompt construction for POST /chat (routers/chatbot.py).

Contract (per docs/api-contract.md, section 5):
    Request:  {message, cityContext}
    Response: {reply}

cityContext is expected to look roughly like:
    {
        "cityName": "Pune",
        "aqi": 142,
        "healthScore": 61,
        "greenCoverPct": 18.4,
        ...
    }
"""

from app.utils.helpers import format_city_metrics_for_prompt, truncate_text


SYSTEM_PROMPT = """You are EcoSathi Assistant — a smart, helpful, and friendly AI chatbot \
built into the EcoSathi urban environmental monitoring platform.

Your PRIMARY expertise is environmental and civic topics: air quality (AQI), green cover, \
CO2/O2 balance, water quality, waste management, eco-actions, pollution complaints, and \
city environmental health.

However, you are a GENERAL ASSISTANT and you MUST answer ANY question the user asks — \
whether it's about science, history, technology, cooking, health, math, or anything else. \
Do NOT refuse or deflect general knowledge questions. Always give a helpful, accurate answer.

Guidelines:
- Answer ALL questions fully and helpfully, regardless of topic.
- For environmental / civic topics, use the live city metrics provided when relevant.
- Keep answers clear and conversational (2-5 sentences for simple questions, more detail \
when the user explicitly asks).
- Never invent specific numbers (AQI, CO2, health score) that weren't given to you.
- Do NOT say "I can only answer environmental questions" — you can answer everything.
- Be warm, encouraging, and helpful at all times."""


def build_chatbot_messages(message: str, city_context: dict | None = None) -> list[dict]:
    """
    Build the `messages` list for the Anthropic Messages API call in llm_service.py.

    Returns a list like:
        [{"role": "user", "content": "<context + question>"}]
    which llm_service.py can pass straight through alongside SYSTEM_PROMPT as the
    top-level `system` parameter.
    """
    context_block = (
        format_city_metrics_for_prompt(city_context)
        if city_context
        else "- No live city data provided for this message"
    )
    city_name = city_context.get("cityName", "the user's city") if city_context else "the user's city"

    user_content = (
        f"City: {city_name}\n"
        f"Current metrics:\n{context_block}\n\n"
        f"User question: {truncate_text(message, max_chars=1500)}"
    )

    return [{"role": "user", "content": user_content}]