"""
Backboard.io API client for claim verification via web search + LLM adjudication.
Falls back to INSUFFICIENT (low confidence) when Backboard is unavailable.
Uses local SQLite cache for claim fingerprints to avoid re-verifying identical claims.
"""

import json
import os
import re
from typing import Literal, Optional

import requests

from app.models import EvidenceItem
from app.utils.hashing import claim_hash
from app.db import get_cached_claim, cache_claim

BACKBOARD_API_KEY = os.getenv("BACKBOARD_API_KEY", "")
BACKBOARD_BASE_URL = os.getenv("BACKBOARD_BASE_URL", "https://api.backboard.io/v1").rstrip("/")
BACKBOARD_TIMEOUT = 30

Verdict = Literal["SUPPORTED", "CONTRADICTED", "INSUFFICIENT"]


def _adjudication_prompt(claim: str) -> str:
    return f"""You are a fact-checker. Given the following claim and the web search results/context provided, determine the verdict.

Claim: "{claim}"

Based on the retrieved sources, return ONLY valid JSON:
{{
  "verdict": "SUPPORTED" | "CONTRADICTED" | "INSUFFICIENT",
  "confidence": 0.0 to 1.0,
  "evidence": [
    {{"source": "Source name", "url": "https://...", "stance": "supports|contradicts|neutral", "note": "1-2 sentence explanation"}}
  ]
}}

Rules:
- SUPPORTED: Reliable sources confirm the claim
- CONTRADICTED: Reliable sources refute the claim
- INSUFFICIENT: Not enough evidence either way
- confidence: 0-1 based on source quality and consistency
- evidence: list 1-3 most relevant sources with url and note

JSON:"""


def _parse_backboard_response(text: str) -> tuple[Verdict, float, list[dict]]:
    """Parse LLM response into verdict, confidence, evidence."""
    text = text.strip()
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            data = json.loads(match.group())
            verdict = data.get("verdict", "INSUFFICIENT").upper()
            if verdict not in ("SUPPORTED", "CONTRADICTED", "INSUFFICIENT"):
                verdict = "INSUFFICIENT"
            confidence = float(data.get("confidence", 0.3))
            confidence = max(0, min(1, confidence))
            evidence = data.get("evidence", [])
            if not isinstance(evidence, list):
                evidence = []
            return verdict, confidence, evidence[:5]
        except (json.JSONDecodeError, (KeyError, TypeError, ValueError)):
            pass
    return "INSUFFICIENT", 0.3, []


def _call_backboard(prompt: str, web_search: bool = True) -> Optional[str]:
    """
    Call Backboard API (OpenAI-compatible chat completion).
    Uses web_search parameter for real-time retrieval when available.
    """
    if not BACKBOARD_API_KEY:
        return None

    url = f"{BACKBOARD_BASE_URL}/chat/completions"
    headers = {
        "Authorization": f"Bearer {BACKBOARD_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": os.getenv("BACKBOARD_MODEL", "gpt-4o-mini"),  # or Backboard-specific model
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1024,
        "temperature": 0.1,
    }
    # Backboard web search (if supported)
    if web_search:
        payload["web_search"] = "Auto"

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=BACKBOARD_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        choice = data.get("choices", [{}])[0]
        return choice.get("message", {}).get("content")
    except Exception as e:
        print(f"Backboard API error: {e}")
        return None


def verify_claim(
    claim_text: str,
    claim_id: str,
    use_cache: bool = True,
) -> tuple[Verdict, float, list[EvidenceItem], bool]:
    """
    Verify a single claim via Backboard (or cache).
    Returns (verdict, confidence, evidence_list, cache_hit).
    """
    ch = claim_hash(claim_text)

    if use_cache:
        cached = get_cached_claim(ch)
        if cached:
            def _norm_stance(s):
                s = (s or "neutral").lower()
                return s if s in ("supports", "contradicts", "neutral") else "neutral"
            evidence = [
                EvidenceItem(
                    source=e.get("source", "Unknown"),
                    url=e.get("url", ""),
                    stance=_norm_stance(e.get("stance")),
                    note=e.get("note", ""),
                )
                for e in cached.get("evidence", [])
            ]
            return (
                cached["verdict"],
                cached["confidence"],
                evidence,
                True,  # cache hit
            )

    # Call Backboard
    prompt = _adjudication_prompt(claim_text)
    response = _call_backboard(prompt)

    if response:
        verdict, confidence, evidence_raw = _parse_backboard_response(response)
        evidence = []
        for e in evidence_raw:
            if isinstance(e, dict):
                stance = (e.get("stance") or "neutral").lower()
                if stance not in ("supports", "contradicts", "neutral"):
                    stance = "neutral"
                evidence.append(
                    EvidenceItem(
                        source=str(e.get("source", "Unknown"))[:200],
                        url=str(e.get("url", ""))[:500],
                        stance=stance,
                        note=str(e.get("note", ""))[:500],
                    )
                )
        # Cache result
        cache_claim(
            ch,
            verdict,
            confidence,
            [{"source": ev.source, "url": ev.url, "stance": ev.stance, "note": ev.note} for ev in evidence],
        )
        return verdict, confidence, evidence, False

    # Fallback: INSUFFICIENT, low confidence (Backboard unavailable)
    return (
        "INSUFFICIENT",
        0.2,
        [
            EvidenceItem(
                source="Verification unavailable",
                url="",
                stance="neutral",
                note="External verification service was unavailable. Please verify manually.",
            )
        ],
        False,
    )
