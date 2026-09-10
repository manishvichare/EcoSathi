# ai-service/app/prompts/notice_prompt.py
"""
Prompt construction for POST /generate-notice (routers/notice_generator.py).

Contract (per docs/api-contract.md, section 5):
    Request:  {complaintData}
    Response: {notice_text}

complaintData is expected to look roughly like the output of /analyze-complaint
merged with the original submission:
    {
        "description": "...",
        "location": "MG Road, Pune",
        "severity": "high",
        "category": "illegal dumping",
        "summary": "..."          # from vision_service.py's analysis
    }
"""

from app.utils.helpers import truncate_text


SYSTEM_PROMPT = """You are drafting formal environmental complaint notices on behalf of \
EcoSathi, a civic environmental monitoring platform, for submission to local municipal \
authorities.

Guidelines:
- Write in a formal, respectful, bureaucratic register -- this is an official notice, \
not a casual message.
- Structure: a subject line, a brief statement of the issue, the location, the observed \
severity/category, and a clear requested action with a reasonable timeframe.
- Do not fabricate details (dates, names, regulation numbers) that weren't provided.
- Keep it to one page (roughly 150-250 words).
- Always include a line noting this notice was AI-generated and should be reviewed \
before submission, per the platform's transparency policy."""


def build_notice_prompt(complaint_data: dict) -> str:
    """
    Build the single user-turn prompt string for the notice-generation call.
    Returned as plain text; llm_service.py wraps it as the `messages` payload.
    """
    description = truncate_text(complaint_data.get("description", ""), max_chars=1000)
    location = complaint_data.get("location", "Location not specified")
    severity = complaint_data.get("severity", "unspecified")
    category = complaint_data.get("category", "unspecified")
    summary = complaint_data.get("summary", "")

    return (
        "Draft a formal notice to the local municipal authority based on the following "
        "citizen-submitted environmental complaint:\n\n"
        f"Category: {category}\n"
        f"Severity: {severity}\n"
        f"Location: {location}\n"
        f"Citizen description: {description}\n"
        f"AI image analysis summary: {summary or 'N/A'}\n\n"
        "Produce only the notice text, ready to be reviewed and sent."
    )