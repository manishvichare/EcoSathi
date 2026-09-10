# ai-service/app/utils/helpers.py
"""
Shared helper functions used across routers and services in the AI microservice.

Covers:
- Logging setup
- Image encoding/validation (for the vision severity-check flow)
- Robust JSON parsing of LLM output (models love to wrap JSON in ```json fences)
- Text truncation (keep prompts/token usage sane)
- Formatting raw city metrics into prompt-friendly text
- A small async retry wrapper for flaky external API calls (Anthropic/OpenAI/WAQI etc.)
"""

import asyncio
import base64
import json
import logging
import re
from functools import wraps
from typing import Any, Callable, Optional


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def setup_logger(name: str, level: int = logging.INFO) -> logging.Logger:
    """
    Create (or fetch) a logger with a consistent format across the service.
    Call this once per module: `logger = setup_logger(__name__)`
    """
    logger = logging.getLogger(name)
    if not logger.handlers:  # avoid duplicate handlers on hot-reload
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(level)
    return logger


logger = setup_logger(__name__)


# ---------------------------------------------------------------------------
# Image handling (used by complaint_analysis.py -> vision_service.py)
# ---------------------------------------------------------------------------

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB, matches typical Multer limits on the Node side


def validate_image_bytes(content: bytes, content_type: str) -> None:
    """
    Raise ValueError if the uploaded complaint photo fails basic checks.
    Call this before doing anything expensive (base64 encode, API call).
    """
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise ValueError(
            f"Unsupported image type '{content_type}'. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )
    if len(content) == 0:
        raise ValueError("Empty image file received.")
    if len(content) > MAX_IMAGE_SIZE_BYTES:
        raise ValueError(
            f"Image too large ({len(content)} bytes). Max is {MAX_IMAGE_SIZE_BYTES} bytes."
        )


def encode_image_to_base64(content: bytes) -> str:
    """Base64-encode raw image bytes for the Anthropic/OpenAI vision message payload."""
    return base64.b64encode(content).decode("utf-8")


def build_vision_image_block(content: bytes, content_type: str) -> dict:
    """
    Build the `image` content block Anthropic's Messages API expects.
    Validates first, so this is safe to call directly on an uploaded file's bytes.
    """
    validate_image_bytes(content, content_type)
    return {
        "type": "image",
        "source": {
            "type": "base64",
            "media_type": content_type,
            "data": encode_image_to_base64(content),
        },
    }


# ---------------------------------------------------------------------------
# LLM output parsing
# ---------------------------------------------------------------------------

_JSON_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def safe_json_parse(raw_text: str) -> Optional[dict]:
    """
    Parse JSON out of an LLM response that *should* be JSON but might come back
    wrapped in markdown fences, with leading/trailing prose, etc.

    Returns None (instead of raising) on failure so callers can decide how to
    degrade gracefully (e.g. return a fallback suggestion list) rather than 500.
    """
    if not raw_text:
        return None

    cleaned = _JSON_FENCE_RE.sub("", raw_text).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Last resort: grab the first {...} or [...] block in the text
    match = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            logger.warning("safe_json_parse: found a JSON-like block but it still failed to parse")

    logger.warning("safe_json_parse: could not extract valid JSON from LLM output")
    return None


# ---------------------------------------------------------------------------
# Text utilities
# ---------------------------------------------------------------------------

def truncate_text(text: str, max_chars: int = 2000, suffix: str = "... [truncated]") -> str:
    """Trim overly long complaint descriptions / chat history before they hit a prompt."""
    if text is None:
        return ""
    if len(text) <= max_chars:
        return text
    return text[: max_chars - len(suffix)] + suffix


def format_city_metrics_for_prompt(metrics: dict) -> str:
    """
    Turn a raw cityMetrics dict (as sent by the Node backend to /daily-suggestion
    and /predict-trend) into a compact, readable block for prompt injection.

    Expects keys like: aqi, co2Level, o2Level, greenCoverPct, healthScore, temperature, humidity
    Missing keys are simply skipped rather than raising.
    """
    label_map = {
        "aqi": "AQI",
        "co2Level": "CO2 level",
        "o2Level": "O2 level",
        "greenCoverPct": "Green cover %",
        "healthScore": "Overall health score",
        "temperature": "Temperature (°C)",
        "humidity": "Humidity (%)",
    }
    lines = []
    for key, label in label_map.items():
        if key in metrics and metrics[key] is not None:
            lines.append(f"- {label}: {metrics[key]}")
    return "\n".join(lines) if lines else "- No metrics provided"


# ---------------------------------------------------------------------------
# Severity mapping (used by complaint_analysis.py)
# ---------------------------------------------------------------------------

SEVERITY_LEVELS = ["low", "moderate", "high", "critical"]


def normalize_severity(raw_value: Any) -> str:
    """
    Coerce whatever the vision model returns (string, number 1-4, etc.) into
    one of SEVERITY_LEVELS, defaulting to 'moderate' if unrecognized -- never
    let a parsing hiccup silently produce an invalid enum value downstream.
    """
    if isinstance(raw_value, str) and raw_value.lower() in SEVERITY_LEVELS:
        return raw_value.lower()
    if isinstance(raw_value, (int, float)):
        idx = max(0, min(int(raw_value) - 1, len(SEVERITY_LEVELS) - 1))
        return SEVERITY_LEVELS[idx]
    logger.warning(f"normalize_severity: unrecognized value '{raw_value}', defaulting to 'moderate'")
    return "moderate"


# ---------------------------------------------------------------------------
# Retry wrapper for external API calls (Anthropic/OpenAI/WAQI/Overpass)
# ---------------------------------------------------------------------------

def async_retry(max_attempts: int = 3, delay_seconds: float = 1.0, backoff: float = 2.0):
    """
    Decorator for async functions that call flaky external services.
    Retries with exponential backoff; re-raises the last exception if all attempts fail.

    Usage:
        @async_retry(max_attempts=3)
        async def call_claude(...):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            attempt = 0
            current_delay = delay_seconds
            while True:
                attempt += 1
                try:
                    return await func(*args, **kwargs)
                except Exception as exc:
                    if attempt >= max_attempts:
                        logger.error(f"{func.__name__} failed after {attempt} attempts: {exc}")
                        raise
                    logger.warning(
                        f"{func.__name__} attempt {attempt} failed ({exc}); "
                        f"retrying in {current_delay:.1f}s"
                    )
                    await asyncio.sleep(current_delay)
                    current_delay *= backoff
        return wrapper
    return decorator