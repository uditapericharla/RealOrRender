"""
Orchestrates the full verification pipeline:
1. Extract article content
2. Gemini: claims + manipulation + AI likelihood
3. Backboard: verify each claim
4. Scoring + decision
5. Build VerificationReport
"""

import uuid
from typing import Optional

from app.models import (
    VerificationReport,
    ArticleInfo,
    ClaimResult,
    EvidenceItem,
)
from app.services.extract import extract_article, ExtractedArticle
from app.services.gemini import run_gemini_analysis, get_gemini_fallback
from app.services.backboard import verify_claim
from app.services.scoring import compute_credibility_score, get_decision
from app.db import save_report


def run_verification(
    url: Optional[str] = None,
    raw_text: Optional[str] = None,
) -> Optional[VerificationReport]:
    """
    Full verification pipeline. Returns VerificationReport or None on extraction failure.
    """
    # 1. Extract article
    article = extract_article(url=url, raw_text=raw_text)
    if not article:
        return None

    # 2. Gemini analysis
    gemini_out = run_gemini_analysis(article.text)
    if not gemini_out:
        gemini_out = get_gemini_fallback(article.text)

    # 3. Backboard: verify each claim
    claim_results: list[ClaimResult] = []
    for gc in gemini_out.claims:
        verdict, confidence, evidence, _cache_hit = verify_claim(
            claim_text=gc.text,
            claim_id=gc.id,
            use_cache=True,
        )
        claim_results.append(
            ClaimResult(
                id=gc.id,
                text=gc.text,
                verdict=verdict,
                confidence=confidence,
                evidence=evidence,
            )
        )

    # 4. Scoring
    verdicts = [c.verdict for c in claim_results]
    credibility_score = compute_credibility_score(
        claim_verdicts=verdicts,
        manipulation_signals=gemini_out.manipulation_signals,
        ai_likelihood=gemini_out.ai_likelihood if gemini_out.ai_likelihood else None,
    )
    decision = get_decision(credibility_score)

    # 5. Build report
    verification_id = str(uuid.uuid4())
    report = VerificationReport(
        verification_id=verification_id,
        decision=decision,
        credibility_score=credibility_score,
        ai_likelihood=gemini_out.ai_likelihood,
        manipulation_signals=gemini_out.manipulation_signals or None,
        summary=gemini_out.short_summary,
        article=ArticleInfo(
            title=article.title,
            url=article.url,
            publisher=article.publisher,
            published_date=article.published_date,
        ),
        claims=claim_results,
    )

    # Persist for GET /api/reports/{id}
    save_report(verification_id, report.model_dump_json())

    return report
