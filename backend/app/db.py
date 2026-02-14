"""
SQLite persistence for posts and claim memory (Backboard fallback cache).
"""

import json
import sqlite3
import os
from pathlib import Path
from contextlib import contextmanager
from typing import Optional

# Default DB path (relative to backend/)
DB_DIR = Path(__file__).resolve().parent.parent
DB_PATH = os.getenv("SQLITE_DB_PATH", str(DB_DIR / "data" / "realorrender.db"))


def _ensure_db_dir():
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)


@contextmanager
def get_connection():
    _ensure_db_dir()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    """Create tables if they don't exist."""
    with get_connection() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                verification_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                post_mode TEXT NOT NULL,
                decision TEXT NOT NULL,
                credibility_score REAL NOT NULL,
                article_title TEXT NOT NULL,
                article_url TEXT NOT NULL,
                publisher TEXT,
                summary TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS verification_reports (
                verification_id TEXT PRIMARY KEY,
                report_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            -- Claim memory: store claim fingerprint -> adjudication for faster lookups
            CREATE TABLE IF NOT EXISTS claim_memory (
                claim_hash TEXT PRIMARY KEY,
                verdict TEXT NOT NULL,
                confidence REAL NOT NULL,
                evidence_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
        """)


def save_report(verification_id: str, report_json: str):
    """Store verification report for GET /api/reports/{id}."""
    import datetime
    with get_connection() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO verification_reports (verification_id, report_json, created_at)
            VALUES (?, ?, ?)
            """,
            (verification_id, report_json, datetime.datetime.utcnow().isoformat())
        )


def get_report(verification_id: str) -> Optional[dict]:
    """Retrieve verification report by ID."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT report_json FROM verification_reports WHERE verification_id = ?",
            (verification_id,)
        ).fetchone()
    if row:
        return json.loads(row["report_json"])
    return None


def save_post(post: dict) -> dict:
    """Insert post and return it."""
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO posts (id, verification_id, created_at, post_mode, decision,
                               credibility_score, article_title, article_url, publisher, summary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                post["id"],
                post["verification_id"],
                post["created_at"],
                post["post_mode"],
                post["decision"],
                post["credibility_score"],
                post["article_title"],
                post["article_url"],
                post.get("publisher"),
                post["summary"],
            )
        )
    return post


def get_posts(limit: int = 50) -> list[dict]:
    """Fetch latest posts for feed."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM posts ORDER BY created_at DESC LIMIT ?",
            (limit,)
        ).fetchall()
    return [dict(r) for r in rows]


def clear_posts() -> None:
    """Clear all posts (for reset/fresh start)."""
    with get_connection() as conn:
        conn.execute("DELETE FROM posts")


# --- Claim memory (Backboard-style cache) ---

def get_cached_claim(claim_hash: str) -> Optional[dict]:
    """Return cached adjudication for a claim hash, or None."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT verdict, confidence, evidence_json FROM claim_memory WHERE claim_hash = ?",
            (claim_hash,)
        ).fetchone()
    if row:
        return {
            "verdict": row["verdict"],
            "confidence": row["confidence"],
            "evidence": json.loads(row["evidence_json"]),
        }
    return None


def cache_claim(claim_hash: str, verdict: str, confidence: float, evidence: list[dict]):
    """Store claim adjudication for future lookups."""
    import datetime
    with get_connection() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO claim_memory (claim_hash, verdict, confidence, evidence_json, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (claim_hash, verdict, confidence, json.dumps(evidence), datetime.datetime.utcnow().isoformat())
        )
