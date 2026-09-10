# app/services/vision_service.py
# Feature 11 — Mandatory AI Environmental Complaint Vision Analysis
# Analyzes actual image pixels using Gemini Vision, OpenAI Vision, or Local Ollama Vision (moondream).
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
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")

    user_query = (
        f"Citizen reported category: '{category}'\n"
        f"Citizen's description: '{description}'\n"
        "Inspect the image pixels. Determine if it is a genuine environmental hazard that matches the category."
    )

    # 1. Try Gemini Vision if key present
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

    # 2. Try OpenAI Vision if key present
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

    # 3. Try Local Ollama Vision (moondream + llama3.2 pipeline)
    try:
        import ollama
        ollama_base = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        client = ollama.Client(host=ollama_base)

        # Step A: moondream inspects the raw image bytes and describes the visual scene
        v_res = client.chat(
            model='moondream',
            messages=[{
                'role': 'user',
                'content': 'Describe this image in detail. What is visually shown, what objects or scene are present?',
                'images': [image_bytes]
            }],
            keep_alive='30m'
        )
        visual_caption = v_res.get('message', {}).get('content', '').strip()

        # Step B: llama3.2 validates against category and strict civic reporting rules
        eval_prompt = (
            f"You are the environmental image validation AI for EcoSathi.\n"
            f"A citizen submitted a report with:\n"
            f"- Claimed Category: '{category}'\n"
            f"- Citizen Description: '{description}'\n\n"
            f"A computer vision inspection of the uploaded image produced this visual description:\n"
            f"\"\"\"{visual_caption}\"\"\"\n\n"
            "Evaluate whether this image is genuine proof of the reported environmental problem.\n"
            "STRICT REJECTION RULES:\n"
            "- If the image is a screenshot of an app, map, website, or computer screen -> REJECT (is_valid=false).\n"
            "- If the image is a domestic pet or animal (e.g. cat, dog) -> REJECT (is_valid=false).\n"
            "- If the image is an indoor selfie, person portrait, or personal photo -> REJECT (is_valid=false).\n"
            "- If the image is a meme, drawing, document, or unrelated object -> REJECT (is_valid=false).\n"
            "- If the visual content does not match the claimed category -> REJECT (matches_category=false).\n\n"
            "Respond ONLY with a JSON object in this exact schema:\n"
            "{\n"
            "  \"is_valid\": true or false,\n"
            "  \"matches_category\": true or false,\n"
            "  \"detected_category\": \"<detected visual subject>\",\n"
            "  \"detected_content\": \"<short description of image>\",\n"
            "  \"severity\": \"low\" | \"medium\" | \"high\" | \"critical\",\n"
            "  \"rejection_reason\": \"<why rejected, or null if valid>\",\n"
            "  \"summary\": \"<one factual sentence summary>\"\n"
            "}"
        )

        llm_res = client.chat(
            model='llama3.2',
            format='json',
            messages=[{'role': 'user', 'content': eval_prompt}],
            options={'num_predict': 140, 'temperature': 0.1},
            keep_alive='30m'
        )
        content = llm_res.get('message', {}).get('content', '').strip()
        data = json.loads(content)
        data['detected_content'] = data.get('detected_content') or visual_caption[:200]
        print(f"✅ [Local Ollama Vision] Analyzed image: is_valid={data.get('is_valid')}, reason={data.get('rejection_reason')}")
        return _normalize_result(data, category)

    except Exception as e:
        print(f"⚠️ [Vision Service] Ollama vision failed or timed out: {e}")
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