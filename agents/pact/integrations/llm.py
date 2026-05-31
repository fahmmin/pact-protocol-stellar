"""LLM provider abstraction: Gemini (default) and Anthropic."""

from __future__ import annotations

import logging
import os

logger = logging.getLogger("pact-agents.llm")


def _resolve_provider() -> str:
    explicit = os.environ.get("LLM_PROVIDER", "").strip().lower()
    if explicit in ("gemini", "anthropic"):
        return explicit
    if os.environ.get("GOOGLE_API_KEY", "").strip():
        return "gemini"
    if os.environ.get("ANTHROPIC_API_KEY", "").strip():
        return "anthropic"
    return ""


def generate_terms_summary(system_prompt: str, user_msg: str) -> str | None:
    """Return LLM-generated text or None if unavailable / failed."""
    provider = _resolve_provider()
    if not provider:
        return None

    try:
        if provider == "gemini":
            return _generate_gemini(system_prompt, user_msg)
        return _generate_anthropic(system_prompt, user_msg)
    except Exception as exc:
        logger.warning("LLM generation failed (%s): %s", provider, exc)
        return None


def _generate_gemini(system_prompt: str, user_msg: str) -> str | None:
    from google import genai
    from google.genai import types

    api_key = os.environ.get("GOOGLE_API_KEY", "").strip()
    if not api_key:
        return None

    model = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model,
        contents=user_msg,
        config=types.GenerateContentConfig(system_instruction=system_prompt),
    )
    text = response.text
    return text.strip() if text else None


def _generate_anthropic(system_prompt: str, user_msg: str) -> str | None:
    import anthropic

    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        return None

    model = os.environ.get("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022")
    client = anthropic.Anthropic(api_key=api_key)
    msg = client.messages.create(
        model=model,
        max_tokens=512,
        system=system_prompt,
        messages=[{"role": "user", "content": user_msg}],
    )
    if msg.content and msg.content[0].type == "text":
        return msg.content[0].text.strip()
    return None
