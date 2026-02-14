"""
Article content extraction from URL or raw text.
Uses readability-lxml for URL extraction; falls back to raw_text from client.
"""

import re
from typing import Optional
from dataclasses import dataclass

import requests
from readability import Document
from urllib.parse import urlparse

# Timeout for fetching URLs (seconds)
FETCH_TIMEOUT = 15
MAX_ARTICLE_LENGTH = 20_000  # Security limit


@dataclass
class ExtractedArticle:
    title: str
    text: str
    url: str
    publisher: Optional[str] = None
    published_date: Optional[str] = None


def _extract_domain(url: str) -> Optional[str]:
    """Extract publisher/domain from URL."""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path
        # Remove www.
        if domain.lower().startswith("www."):
            domain = domain[4:]
        return domain if domain else None
    except Exception:
        return None


def _truncate(text: str, max_len: int = MAX_ARTICLE_LENGTH) -> str:
    """Truncate text to max length for security."""
    if len(text) <= max_len:
        return text
    return text[:max_len]


def _clean_text(text: str) -> str:
    """Clean extracted text: normalize whitespace."""
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_from_url(url: str) -> Optional[ExtractedArticle]:
    """
    Fetch URL and extract article content using readability-lxml.
    Returns None if fetch or extraction fails.
    """
    if not url or not url.strip():
        return None

    # Basic URL validation
    if not url.startswith(("http://", "https://")):
        return None

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; RealOrRender/1.0; +https://github.com/realorrender)"
        }
        response = requests.get(url, timeout=FETCH_TIMEOUT, headers=headers)
        response.raise_for_status()

        doc = Document(response.text)
        title = doc.title() or "Untitled"
        text = doc.summary()
        # readability returns HTML; strip tags crudely
        text = re.sub(r"<[^>]+>", " ", text)
        text = _clean_text(_truncate(text))

        if not text:
            return None

        return ExtractedArticle(
            title=title[:500] if title else "Untitled",
            text=text,
            url=url,
            publisher=_extract_domain(url),
            published_date=None,  # readability doesn't extract date; newspaper3k would
        )
    except Exception as e:
        # Log in production
        print(f"Extraction failed for {url}: {e}")
        return None


def extract_from_raw_text(raw_text: str, url: str = "", title: str = "Pasted Article") -> ExtractedArticle:
    """
    Use raw pasted text when URL extraction fails.
    Client can pass raw_text in the request body.
    """
    text = _clean_text(_truncate(raw_text or ""))
    if not text:
        text = "No content"
    return ExtractedArticle(
        title=title[:500] if title else "Pasted Article",
        text=text,
        url=url or "about:blank",
        publisher=_extract_domain(url) if url else None,
        published_date=None,
    )


def extract_article(url: Optional[str] = None, raw_text: Optional[str] = None) -> Optional[ExtractedArticle]:
    """
    Main entry: try URL extraction first, fall back to raw_text.
    Returns None if both fail.
    """
    if url:
        result = extract_from_url(url)
        if result:
            return result

    if raw_text and raw_text.strip():
        return extract_from_raw_text(raw_text, url or "", title="Pasted Article")

    return None
