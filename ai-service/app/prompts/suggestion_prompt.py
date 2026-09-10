# ai-service/app/prompts/suggestion_prompt.py
"""
Prompt construction for POST /daily-suggestion (routers/suggestions.py).

Contract (per docs/api-contract.md, section 5):
    Request:  {cityMetrics}
    Response: {tips: [...]}

Because the response needs to be structured (a list the frontend renders as
cards), this prompt instructs the model to return JSON only, and
suggestions.py should run the result through utils.helpers.safe_json_parse
with a hardcoded fallback list if parsing fails.
"""

from app.utils.helpers import format_city_metrics_for_prompt


SYSTEM_PROMPT = """You are EcoSathi's daily tip generator. Given a city's current \
environmental metrics, you produce a short list of practical, specific eco-actions a \
resident could take today.

Guidelines:
- Tailor tips to the actual metrics given (e.g. high AQI -> mask/ventilation tips; low \
green cover -> tree-planting/balcony-garden tips).
- Each tip should be one sentence, concrete and actionable -- not generic ("go green").
- Respond with ONLY valid JSON, no markdown fences, no extra commentary, in exactly \
this shape:
{"tips": ["tip one", "tip two", "tip three"]}
- Produce between 3 and 5 tips."""


def build_suggestion_prompt(city_metrics: dict) -> str:
    """Build the single user-turn prompt string for the daily-suggestion call."""
    metrics_block = format_city_metrics_for_prompt(city_metrics)
    return (
        "Today's city environmental metrics:\n"
        f"{metrics_block}\n\n"
        "Generate today's eco-tips as JSON per the required format."
    )


# Fallback used by suggestions.py if the LLM call fails or returns unparseable JSON,
# so the endpoint can still return a 200 with something useful for the demo.
FALLBACK_TIPS = [
    "Avoid outdoor exercise during peak traffic hours if AQI is high today.",
    "Carpool or use public transit for one trip today to cut emissions.",
    "Water a nearby tree or plant to support local green cover.",
]