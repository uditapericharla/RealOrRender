"""
FastAPI routers matching frontend contracts exactly.
"""

from fastapi import APIRouter, HTTPException, status

from app.models import (
    VerifyArticleRequest,
    CreatePostRequest,
    VerificationReport,
    Post,
)
from app.services.verify import run_verification
from app.db import get_report, save_post, get_posts, init_db
import uuid
from datetime import datetime

router = APIRouter(prefix="/api", tags=["api"])


@router.post("/verifyArticle", response_model=VerificationReport)
def verify_article(req: VerifyArticleRequest):
    """
    Verify an article by URL or raw text.
    Returns VerificationReport matching frontend contract.
    """
    if not req.url and not req.raw_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either 'url' or 'raw_text'",
        )
    report = run_verification(url=req.url, raw_text=req.raw_text)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract article content. Check URL or provide raw_text.",
        )
    return report


@router.get("/reports/{verification_id}", response_model=VerificationReport)
def get_verification_report(verification_id: str):
    """Return full VerificationReport for report page."""
    report_dict = get_report(verification_id)
    if not report_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    return report_dict


@router.post("/posts", response_model=Post)
def create_post(req: CreatePostRequest):
    """
    Create a post. Enforces policy:
    - ALLOW: only post_mode "normal"
    - WARN: only post_mode "warning_label"
    - BLOCK: reject
    """
    report_dict = get_report(req.verification_id)
    if not report_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification report not found. Verify the article first.",
        )
    decision = report_dict.get("decision", "BLOCK")
    if decision == "BLOCK":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot post: article is blocked (high-risk misinformation)",
        )
    if decision == "ALLOW" and req.post_mode != "normal":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="For ALLOW decision, post_mode must be 'normal'",
        )
    if decision == "WARN" and req.post_mode != "warning_label":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="For WARN decision, post_mode must be 'warning_label'",
        )
    article = report_dict.get("article", {})
    post = {
        "id": str(uuid.uuid4()),
        "verification_id": req.verification_id,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "post_mode": req.post_mode,
        "decision": decision,
        "credibility_score": report_dict.get("credibility_score", 0),
        "article_title": article.get("title", "Untitled"),
        "article_url": article.get("url", ""),
        "publisher": article.get("publisher"),
        "summary": report_dict.get("summary", ""),
    }
    save_post(post)
    return post


@router.get("/posts")
def list_posts():
    """Return latest posts for feed."""
    return get_posts()
