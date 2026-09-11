"""Quick manual Groq structured-output check (requires GROQ_API_KEY)."""

import os
import time

from groq import Groq

category = "illegal-dumping"
description = "garbage and illegal dumping"
visual_caption = "A clean public park with a dirt path, trees, a lamppost, and a pond."

prompt = f"""Classify this environmental complaint using the visual caption.
Claimed category: {category}
Description: {description}
Visual caption: {visual_caption}
Return JSON with is_valid, matches_category, detected_category, severity,
rejection_reason, and summary. Reject a caption that does not support the claim."""

client = Groq(api_key=os.environ["GROQ_API_KEY"])
started = time.time()
response = client.chat.completions.create(
    model=os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"),
    messages=[{"role": "user", "content": prompt}],
    response_format={"type": "json_object"},
    max_completion_tokens=300,
)
print("Done in", round(time.time() - started, 2), "s")
print(response.choices[0].message.content)
