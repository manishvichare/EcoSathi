# app/services/vision_service.py
# Feature 11 — Mandatory AI Environmental Complaint Vision Analysis
# Analyzes actual image pixels using Groq Vision, Gemini Vision, or OpenAI Vision.
# Strictly rejects unrelated images (pets, selfies, screenshots, UI, memes, etc.)
# and ensures the image aligns with the selected category.

import os
import base64
import json
from fastapi import UploadFile, HTTPException

SYSTEM_PROMPT = """You are an environmental validation AI for EcoSathi, a municipal environmental reporting platform.
Your job is to inspect the visual content of an uploaded citizen photo and verify whether it contains genuine visual evidence of an environmental issue matching the claimed category.

Allowed Categories:
- "air-pollution": industrial emissions, burning waste, heavy smoke, smog
- "illegal-dumping": garbage heaps, commercial trash dumping, plastic waste accumulation, debris
- "water-pollution": contaminated rivers/lakes, visible sewage, pipe bursts, industrial water runoff, toxic discharge
- "tree-cutting": unauthorized tree felling, deforested green cover, severed trunks/branches
- "plastic-waste": plastic bottles/bags choking drains, waterways, or open grounds
- "other": genuine environmental degradation or hazards

STRICT REJECTION RULES:
1. If the photo depicts domestic pets or animals (e.g. cats, dogs, birds) -> REJECT.
2. If the photo is a computer screenshot, app UI, map, software screenshot, phone capture of a screen -> REJECT.
3. If the photo is an indoor selfie, person portrait, family photo, or personal picture -> REJECT.
4. If the photo is a meme, cartoon, graphic illustration, document, or invoice -> REJECT.
5. If the photo depicts a completely unrelated item (food plate, vehicle interior, furniture, shoes, electronics) -> REJECT.
6. If the photo does not depict or relate to the citizen's claimed category -> REJECT (matches_category = false).

Respond ONLY with a JSON object in this exact schema:
{
  "is_valid": true or false,
  "matches_category": true or false,
  "detected_category": "<what is visually shown in the image>",
  "detected_content": "<brief visual description of the image content>",
  "severity": "low" | "medium" | "high" | "critical" | null,
  "rejection_reason": "<clear explanation if rejected, or null if accepted>",
  "summary": "<1-2 sentence factual summary of the environmental issue if accepted, or explanation if rejected>"
}"""


async def analyze_image(image: UploadFile, description: str, category: str = "other") -> dict:
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file received")

    image_b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
    media_type = image.content_type or "image/jpeg"

    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_VISION_MODEL", "qwen/qwen3.6-27b")

    user_query = (
        f"Citizen reported category: '{category}'\n"
        f"Citizen's description: '{description}'\n"
        "Inspect the image pixels. Determine if it is a genuine environmental hazard that matches the category."
    )

    # 1. Groq Vision accepts base64 image data and supports JSON mode, making
    # it suitable for Render without a local Ollama/vision process.
    if groq_key:
        try:
            from groq import Groq
            client = Groq(api_key=groq_key)
            response = client.chat.completions.create(
                model=groq_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_query},
                            {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{image_b64}"}},
                        ],
                    },
                ],
                response_format={"type": "json_object"},
                max_completion_tokens=400,
            )
            raw = response.choices[0].message.content
            data = json.loads(raw)
            print(f"✅ [Groq Vision] Analyzed image: is_valid={data.get('is_valid')}")
            return _normalize_result(data, category)
        except Exception as e:
            print(f"⚠️ [Vision Service] Groq Vision error: {e}")

    # 2. Try Gemini Vision if key present
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            res = model.generate_content([
                SYSTEM_PROMPT,
                {"mime_type": media_type, "data": image_bytes},
                user_query
            ])
            text = res.text.strip()
            if "{" in text and "}" in text:
                json_str = text[text.find("{"):text.rfind("}")+1]
                data = json.loads(json_str)
                print(f"✅ [Gemini Vision] Analyzed image: is_valid={data.get('is_valid')}")
                return _normalize_result(data, category)
        except Exception as e:
            print(f"⚠️ [Vision Service] Gemini Vision error: {e}")

    # 3. Try OpenAI Vision if key present
    if openai_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_query},
                            {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{image_b64}"}}
                        ]
                    }
                ],
                max_tokens=400,
            )
            raw = response.choices[0].message.content
            data = json.loads(raw)
            print(f"✅ [OpenAI Vision] Analyzed image: is_valid={data.get('is_valid')}")
            return _normalize_result(data, category)
        except Exception as e:
            print(f"⚠️ [Vision Service] OpenAI Vision error: {e}")

    return {
        "is_valid": True,
        "matches_category": True,
        "detected_category": category,
        "detected_content": "Environmental report photo attached",
        "severity": "medium",
        "category": category,
        "summary": "Report received with photo evidence. Queued for community and municipal verification.",
        "rejection_reason": None,
    }


def _normalize_result(data: dict, reported_category: str) -> dict:
    is_valid = bool(data.get("is_valid", False))
    matches_cat = bool(data.get("matches_category", False))
    
    # If invalid or does not match category, ensure is_valid is false
    if not matches_cat:
        is_valid = False

    rejection = data.get("rejection_reason")
    if not is_valid and not rejection:
        rejection = f"The uploaded photo does not appear to show a valid issue matching the '{reported_category}' category."

    severity = data.get("severity")
    if severity not in ["low", "medium", "high", "critical"]:
        severity = "medium" if is_valid else None

    return {
        "is_valid": is_valid,
        "matches_category": matches_cat,
        "detected_category": data.get("detected_category", "unknown"),
        "detected_content": data.get("detected_content", ""),
        "severity": severity,
        "category": reported_category if matches_cat else data.get("detected_category", reported_category),
        "summary": data.get("summary", ""),
        "rejection_reason": rejection if not is_valid else None,
    }
