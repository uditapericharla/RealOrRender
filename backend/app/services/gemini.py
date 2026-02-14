"""
Gemini API integration: extract claims, manipulation signals, AI likelihood.
Returns structured JSON matching our schema.
"""

import json
import os
import re
import warnings
from typing import Optional

from app.models import GeminiClaimOutput, GeminiOutput

# Optional: use google-generativeai if available (suppress deprecation warning)
with warnings.catch_warnings():
    warnings.simplefilter("ignore", FutureWarning)
    try:
        import google.generativeai as genai
        GEMINI_AVAILABLE = True
    except ImportError:
        genai = None
        GEMINI_AVAILABLE = False


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MAX_CLAIMS = 7
MIN_CLAIMS = 3


GEMINI_PROMPT = """You are a fact-checking assistant. Analyze the following article text and extract atomic factual claims (not opinions).

Return ONLY valid JSON in this exact schema, no other text:
{
  "claims": [
    {"id": "c1", "text": "exact claim as stated", "importance": "high|medium|low"},
    ...
  ],
  "manipulation_signals": ["signal1", "signal2", ...],
  "ai_likelihood": 0.0,
  "short_summary": "1-2 sentence summary"
}

Rules:
- Extract 3-7 atomic factual claims (things that can be verified as true/false). Do NOT include opinions, predictions, or vague statements.
- Use id format: c1, c2, c3, etc.
- importance: "high" for central claims, "medium" for supporting, "low" for minor
- manipulation_signals: list any persuasion/manipulation techniques: "fear appeal", "false urgency", "fake authority", "emotional language", "cherry-picked stats", "us vs them", "conspiracy framing", etc. Empty array if none.
- ai_likelihood: 0.0-1.0 probability that this content was AI-generated. 0 = likely human, 1 = likely AI.
- short_summary: neutral 1-2 sentence summary

Article text:
---
{text}
---

JSON output:"""


def _parse_gemini_json(response_text: str) -> Optional[GeminiOutput]:
    """Parse Gemini response into GeminiOutput. Handle markdown code blocks."""
    text = response_text.strip()
    # Extract JSON from markdown code block if present
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        text = match.group(1).strip()
    # Try to find JSON object
    start = text.find("{")
    if start >= 0:
        depth = 0
        end = -1
        for i, c in enumerate(text[start:], start):
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    end = i
                    break
        if end >= 0:
            text = text[start : end + 1]
    try:
        data = json.loads(text)
        claims = [
            GeminiClaimOutput(
                id=c.get("id", f"c{i+1}"),
                text=c.get("text", ""),
                importance=c.get("importance", "medium"),
            )
            for i, c in enumerate(data.get("claims", [])[:MAX_CLAIMS])
        ]
        if len(claims) < MIN_CLAIMS and data.get("claims"):
            # Pad with any remaining
            for i, c in enumerate(data.get("claims", [])[MAX_CLAIMS:]):
                if i + len(claims) >= MIN_CLAIMS:
                    break
                claims.append(
                    GeminiClaimOutput(
                        id=c.get("id", f"c{len(claims)+1}"),
                        text=c.get("text", ""),
                        importance=c.get("importance", "medium"),
                    )
                )
        return GeminiOutput(
            claims=claims,
            manipulation_signals=data.get("manipulation_signals", []) or [],
            ai_likelihood=float(data.get("ai_likelihood", 0.0)),
            short_summary=data.get("short_summary", "Summary unavailable.")[:500],
        )
    except (json.JSONDecodeError, (KeyError, TypeError, ValueError)) as e:
        print(f"Gemini JSON parse error: {e}")
        return None


def run_gemini_analysis(article_text: str) -> Optional[GeminiOutput]:
    """
    Call Gemini API to extract claims and manipulation signals.
    Returns None on failure (caller should use fallback).
    """
    if not GEMINI_API_KEY:
        print("GEMINI_API_KEY not set")
        return None

    if not GEMINI_AVAILABLE:
        print("google-generativeai not installed")
        return None

    # Truncate for token limits
    text = article_text[:15000] if len(article_text) > 15000 else article_text

    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(
            GEMINI_PROMPT.format(text=text),
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                max_output_tokens=2048,
            ),
        )
        if response and response.text:
            return _parse_gemini_json(response.text)
    except Exception as e:
        print(f"Gemini API error: {e}")

    return None


def get_gemini_fallback(article_text: str) -> GeminiOutput:
    """
    Deterministic fallback when Gemini is unavailable.
    Extracts simple "claims" by sentence splitting; no manipulation signals.
    """
    import re
    sentences = re.split(r"[.!?]+", article_text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20][:MAX_CLAIMS]
    if len(sentences) < MIN_CLAIMS:
        sentences.append("This article makes several factual assertions.")  # placeholder
    claims = [
        GeminiClaimOutput(id=f"c{i+1}", text=s[:300], importance="medium")
        for i, s in enumerate(sentences[:MAX_CLAIMS])
    ]
    return GeminiOutput(
        claims=claims,
        manipulation_signals=[],
        ai_likelihood=0.0,
        short_summary=article_text[:200] + "..." if len(article_text) > 200 else article_text,
    )
