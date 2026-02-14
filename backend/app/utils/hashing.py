"""
Hashing utilities for claim fingerprints (used in Backboard memory / cache).
"""

import hashlib
import re


def normalize_claim_text(text: str) -> str:
    """Normalize claim text for consistent hashing."""
    if not text or not isinstance(text, str):
        return ""
    # Lowercase, collapse whitespace, strip
    normalized = re.sub(r"\s+", " ", text.lower().strip())
    return normalized


def claim_hash(text: str) -> str:
    """SHA256 hash of normalized claim text. Used as cache key."""
    normalized = normalize_claim_text(text)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()
