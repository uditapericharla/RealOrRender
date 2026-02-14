# RealOrRender Backend

Pre-share verification layer for articles: extracts claims, detects manipulation, verifies against web sources, and scores credibility before users can post.

## Tech Stack

- **Python 3.11+**
- **FastAPI**
- **SQLite** (persistence)
- **Gemini API** (claim extraction, manipulation signals, AI likelihood)
- **Backboard.io** (web search + LLM adjudication for claim verification)

## Setup

### Prerequisites

- Python 3.11+
- pip

### Installation

```bash
cd backend
pip install -r requirements.txt
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | [Get key](https://makersuite.google.com/app/apikey) — required for claim extraction |
| `BACKBOARD_API_KEY` | [Get key](https://backboard.io) — required for claim verification. If missing, falls back to INSUFFICIENT (low confidence) |
| `BACKBOARD_BASE_URL` | Default: `https://api.backboard.io/v1` |
| `BACKBOARD_MODEL` | LLM model for adjudication, default: `gpt-4o-mini` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins, default: `http://localhost:3000` |
| `SQLITE_DB_PATH` | Optional; default: `./data/realorrender.db` |

## Run Locally

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs

## Docker (Vultr Deployment)

### One-command deploy

```bash
# Create .env with your keys first
cp .env.example .env
# Edit .env with GEMINI_API_KEY, BACKBOARD_API_KEY, etc.

docker-compose up -d
```

Backend runs on port 8000. SQLite data is persisted in a Docker volume.

### Manual build

```bash
docker build -t realorrender-backend .
docker run -p 8000:8000 --env-file .env -v realorrender-data:/app/data realorrender-backend
```

## API Endpoints

All endpoints match the frontend TypeScript contracts.

### POST /api/verifyArticle

Verify an article by URL or raw text.

**Request:**
```json
{
  "url": "https://example.com/article",
  "raw_text": null,
  "comment": "optional user comment"
}
```

Or with raw pasted text (when URL extraction fails):
```json
{
  "url": null,
  "raw_text": "Full article text pasted here..."
}
```

**Response:** `VerificationReport` (see types below)

### POST /api/posts

Create a post after verification.

**Request:**
```json
{
  "verification_id": "uuid-from-verify",
  "post_mode": "normal"
}
```

- `post_mode`: `"normal"` for ALLOW, `"warning_label"` for WARN
- BLOCK decisions are rejected with 403

**Response:** `Post` object

### GET /api/posts

Returns latest posts for the feed.

### GET /api/reports/{verification_id}

Returns full `VerificationReport` for the report page.

## Sample cURL Requests

```bash
# Verify article
curl -X POST http://localhost:8000/api/verifyArticle \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.bbc.com/news/world"}'

# Get report (use verification_id from above)
curl http://localhost:8000/api/reports/YOUR_VERIFICATION_ID

# Create post (ALLOW → normal, WARN → warning_label)
curl -X POST http://localhost:8000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"verification_id": "YOUR_VERIFICATION_ID", "post_mode": "normal"}'

# List posts
curl http://localhost:8000/api/posts

# Health check
curl http://localhost:8000/health
```

## Scoring & Policy

- **Credibility score** 0–100: Start at 100, subtract for CONTRADICTED (-25 each), INSUFFICIENT (-10 each), manipulation signals (-3 each, max -15), AI likelihood penalty (0–10)
- **Decision**: ≥75 ALLOW, 50–74 WARN, &lt;50 BLOCK
- **Post rules**: ALLOW → `post_mode: "normal"` only; WARN → `post_mode: "warning_label"` only; BLOCK → reject

## Folder Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI app, CORS
│   ├── api.py           # Routes
│   ├── models.py        # Pydantic models
│   ├── db.py            # SQLite
│   ├── services/
│   │   ├── extract.py   # Article extraction (readability-lxml)
│   │   ├── gemini.py    # Claim + manipulation extraction
│   │   ├── backboard.py # Claim verification (web search + LLM)
│   │   ├── scoring.py   # Credibility + decision
│   │   └── verify.py    # Pipeline orchestration
│   └── utils/
│       └── hashing.py   # Claim fingerprint for cache
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```
