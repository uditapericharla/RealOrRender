"""
Pydantic models matching the frontend TypeScript contracts exactly.
"""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


# --- Verification report (matches frontend VerificationReport) ---

class ArticleInfo(BaseModel):
    title: str
    url: str
    publisher: Optional[str] = None
    published_date: Optional[str] = None


class EvidenceItem(BaseModel):
    source: str
    url: str
    stance: Literal["supports", "contradicts", "neutral"]
    note: str


class ClaimResult(BaseModel):
    id: str
    text: str
    verdict: Literal["SUPPORTED", "CONTRADICTED", "INSUFFICIENT"]
    confidence: float  # 0-1
    evidence: list[EvidenceItem] = Field(default_factory=list)


class VerificationReport(BaseModel):
    verification_id: str
    decision: Literal["ALLOW", "WARN", "BLOCK"]
    credibility_score: float  # 0-100
    ai_likelihood: Optional[float] = None  # 0-1
    manipulation_signals: Optional[list[str]] = None
    summary: str
    article: ArticleInfo
    claims: list[ClaimResult]


# --- Post (matches frontend Post) ---

class Post(BaseModel):
    id: str
    verification_id: str
    created_at: str  # ISO format
    post_mode: Literal["normal", "warning_label"]
    decision: Literal["ALLOW", "WARN", "BLOCK"]
    credibility_score: float
    article_title: str
    article_url: str
    publisher: Optional[str] = None
    summary: str


# --- API request/response schemas ---

class VerifyArticleRequest(BaseModel):
    url: Optional[str] = None
    raw_text: Optional[str] = None  # Fallback when URL extraction fails
    comment: Optional[str] = None


class CreatePostRequest(BaseModel):
    verification_id: str
    post_mode: Literal["normal", "warning_label"]


# --- Internal / Gemini schemas ---

class GeminiClaimOutput(BaseModel):
    id: str
    text: str
    importance: str  # high/medium/low


class GeminiOutput(BaseModel):
    claims: list[GeminiClaimOutput]
    manipulation_signals: list[str]
    ai_likelihood: float  # 0-1
    short_summary: str
