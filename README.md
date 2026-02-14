# RealOrRender

A mini social media web app with a **pre-share verification layer** for article links. Before sharing, articles are verified for credibility and misinformation risk. The UI shows ALLOW/WARN/BLOCK decisions with clear badges and evidence.

## Tech Stack

**Frontend:** Next.js 14+, TypeScript, Tailwind CSS  
**Backend:** Python 3.11+, FastAPI, SQLite, Gemini API, Backboard.io

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file (or copy from `.env.example`):

```bash
# Backend API base URL (e.g., http://localhost:3001)
# Leave empty to use mock/offline fallback data for demo
NEXT_PUBLIC_API_BASE_URL=
```

- **`NEXT_PUBLIC_API_BASE_URL`**: Base URL for the backend API.  
  - Example: `http://localhost:8000` when running the backend locally  
  - Leave empty to run in demo/offline mode — the app will use mock verification reports and localStorage for posts

### Running with Backend (Real Article Analysis)

**Important:** Without the backend, the app uses demo/sample data. To analyze real articles:

1. **Start the backend** (Terminal 1):
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

2. **Create `.env.local`** in the project root with:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

3. **Restart the frontend** (Terminal 2) — stop `npm run dev`, then:
   ```bash
   rm -rf .next
   npm run dev
   ```

4. If you see "Demo mode" banner, the env var wasn't loaded — ensure `.env.local` is in the same folder as `package.json` and restart again.

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

## Backend API Contracts

The frontend expects these endpoints (or falls back to mocks/localStorage when unavailable):

### POST `/api/verifyArticle`

**Request:**
```json
{ "url": "https://...", "comment": "optional" }
```

**Response:** `VerificationReport` (see `src/types/index.ts`)

### POST `/api/posts`

**Request:**
```json
{ "verification_id": "string", "post_mode": "normal" | "warning_label" }
```

**Response:** `Post` object

### GET `/api/posts`

**Response:** Array of `Post` objects

### GET `/api/reports/{verificationId}` (optional)

**Response:** `VerificationReport` for the given ID

## Features

- **Share Article flow**: Paste URL → Verify → See credibility score + decision → Post (if allowed)
- **ALLOW**: Post button enabled
- **WARN**: "Post with Warning Label" button enabled
- **BLOCK**: Posting disabled; "High-risk misinformation" message shown
- **Feed**: Post cards with score badge, decision badge, warning banner for WARN posts
- **Verification Report page**: Full claims table + evidence links at `/report/[verificationId]`
- **Offline demo**: Mock data and localStorage persistence when backend is unavailable

## Project Structure

```
├── backend/          # FastAPI backend (see backend/README.md)
├── src/              # Next.js frontend
├── app/
│   ├── layout.tsx
│   ├── page.tsx           # Home feed
│   ├── globals.css
│   └── report/[verificationId]/page.tsx
├── components/
│   ├── ShareArticleModal.tsx
│   ├── VerificationSummary.tsx
│   ├── ClaimTable.tsx
│   ├── PostCard.tsx
│   └── DecisionBadge.tsx
├── hooks/
│   └── usePosts.ts
├── lib/
│   ├── api.ts
│   ├── postStore.ts
│   └── mockData.ts
└── types/
    └── index.ts
```
