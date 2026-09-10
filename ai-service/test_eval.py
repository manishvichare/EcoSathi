import time
import json
import ollama

client = ollama.Client(host='http://localhost:11434')

category = 'illegal-dumping'
description = 'garbage and illegal dumping'
visual_caption = 'The image depicts a serene park scene with a dirt path winding through lush green trees. The path is bordered by a variety of trees and bushes, creating a natural canopy. A lamppost stands on the right side of the path, and a small pond is visible in the background. The sky above is a clear blue, suggesting a bright and sunny day.'

eval_prompt = f"""You are the environmental image validation AI for EcoSathi.
A citizen submitted a report with:
- Claimed Category: '{category}'
- Citizen Description: '{description}'

A computer vision inspection of the uploaded image produced this visual description:
\"\"\"{visual_caption}\"\"\"

Evaluate whether this image is genuine proof of the reported environmental problem.
STRICT REJECTION RULES:
- If the image is a screenshot of an app, map, website, or computer screen -> REJECT (is_valid=false).
- If the image is a domestic pet or animal (e.g. cat, dog) -> REJECT (is_valid=false).
- If the image is an indoor selfie, person portrait, or personal photo -> REJECT (is_valid=false).
- If the image is a meme, drawing, document, or unrelated object -> REJECT (is_valid=false).
- If the visual content does not match the claimed category -> REJECT (matches_category=false).

Respond ONLY with a JSON object in this exact schema:
{{
  "is_valid": true or false,
  "matches_category": true or false,
  "detected_category": "<detected visual subject>",
  "detected_content": "<short description of image>",
  "severity": "low" | "medium" | "high" | "critical",
  "rejection_reason": "<why rejected, or null if valid>",
  "summary": "<one factual sentence summary>"
}}
"""

t0 = time.time()
print("Calling llama3.2...")
llm_res = client.chat(
    model='llama3.2',
    format='json',
    messages=[{'role': 'user', 'content': eval_prompt}]
)
print("Done in", round(time.time() - t0, 2), "s")
print("Output:", llm_res.get('message', {}).get('content', ''))
