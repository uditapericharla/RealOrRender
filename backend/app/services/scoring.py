"""
Credibility scoring and decision rules.
Matches the exact policy specified:
- Start at 100
- CONTRADICTED: -25 each
- INSUFFICIENT: -10 each
- SUPPORTED: 0
- manipulation_signals: -3 each, max -15
- ai_likelihood: optional -0 to -10 (ai_likelihood * 10)
- Clamp 0-100
- >= 75 => ALLOW
- 50-74 => WARN
- < 50 => BLOCK
"""

from typing import Literal

CONTRADICTED_PENALTY = 25
INSUFFICIENT_PENALTY = 10
SUPPORTED_PENALTY = 0
MANIPULATION_PENALTY_PER = 3
MANIPULATION_MAX_PENALTY = 15
AI_LIKELIHOOD_MAX_PENALTY = 10


def compute_credibility_score(
    claim_verdicts: list[str],
    manipulation_signals: list[str],
    ai_likelihood: float | None,
) -> float:
    """
    Compute credibility score 0-100 using the policy.
    """
    score = 100.0

    for v in claim_verdicts:
        v = (v or "").upper()
        if v == "CONTRADICTED":
            score -= CONTRADICTED_PENALTY
        elif v == "INSUFFICIENT":
            score -= INSUFFICIENT_PENALTY
        elif v == "SUPPORTED":
            score -= SUPPORTED_PENALTY

    # Manipulation penalty: -3 per signal, max -15
    n_signals = min(len(manipulation_signals or []), 5)  # max 5 signals count
    score -= min(n_signals * MANIPULATION_PENALTY_PER, MANIPULATION_MAX_PENALTY)

    # AI likelihood penalty: 0-10 (ai_likelihood in 0-1 maps to 0-10)
    if ai_likelihood is not None:
        ai_penalty = min(ai_likelihood * AI_LIKELIHOOD_MAX_PENALTY, AI_LIKELIHOOD_MAX_PENALTY)
        score -= ai_penalty

    return max(0.0, min(100.0, round(score, 1)))


def get_decision(credibility_score: float) -> Literal["ALLOW", "WARN", "BLOCK"]:
    """
    Map score to decision:
    - >= 75 => ALLOW
    - 50-74 => WARN
    - < 50 => BLOCK
    """
    if credibility_score >= 75:
        return "ALLOW"
    if credibility_score >= 50:
        return "WARN"
    return "BLOCK"
