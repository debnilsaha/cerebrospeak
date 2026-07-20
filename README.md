# CerebroSpeak

**A voice for every thought.** CerebroSpeak is an AI-powered Augmentative and
Alternative Communication (AAC) platform that helps non-verbal children
communicate. A caregiver speaks; the child is offered intelligent, personalized,
symbol-supported word choices; and their sentences are spoken aloud in a
custom voice — all through cloud AI, with no local GPU required.

## Features

- **Speech-to-text** (Deepgram) — understands the caregiver's speech
- **AI word prediction** (Claude) — context-aware, Fitzgerald-color-coded grid
- **Text-to-speech** (ElevenLabs) — speaks in a custom child voice
- **Quick replies** — ready-made responses to tap
- **Say Anything** — three-tier vocabulary access so no word is unreachable
- **Switch scanning** — usable by children who cannot point
- **Persistent memory** — learns each child and personalizes over time
- **Session summaries** — warm, plain-language recaps for caregivers
- **Caregiver dashboard** — review history, control what's remembered
- **PWA** — installable, works offline for the core board, keeps screen awake

## Architecture

- **Backend:** FastAPI (Python 3.12, async), SQLModel + SQLite, structured
  logging, layered as routers → services → clients → schemas.
- **Frontend:** React 19 + TypeScript + Vite, Tailwind v4, Zustand, TanStack
  Query, Framer Motion. Claymorphism design with a Bento layout.

## Prerequisites

- **Python 3.12** (managed via [uv](https://github.com/astral-sh/uv))
- **Node.js 22 LTS** (managed via [fnm](https://github.com/Schniz/fnm))
- **uv** and **pnpm** package managers
- API keys for **Anthropic**, **Deepgram**, and **ElevenLabs**

## Setup

### 1. API keys

Create accounts and get API keys:
- Anthropic: https://console.anthropic.com (add a few dollars of credit)
- Deepgram: https://console.deepgram.com (free tier available)
- ElevenLabs: https://elevenlabs.io (create your own voice via Voice Design;
  copy its Voice ID from "My Voices")

### 2. Backend

```bash
cd backend
uv sync
```

Create `backend/.env` (UTF-8, no BOM) with:
ANTHROPIC_API_KEY=your-key
DEEPGRAM_API_KEY=your-key
ELEVENLABS_API_KEY=your-key
ELEVENLABS_VOICE_ID=your-voice-id
DATABASE_URL=sqlite+aiosqlite:///./cerebrospeak.db
LOG_LEVEL=INFO
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173

Run the backend:

```bash
uv run uvicorn app.main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs

### 3. Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

App: http://localhost:5173

Both servers must run at the same time (the frontend proxies `/api` to the
backend on port 8000).

## Testing

Backend:

```bash
cd backend
uv run pytest -v
```

Frontend:

```bash
cd frontend
pnpm test
```

Tests mock all AI providers — they run fast, offline, and cost nothing.

## Building the PWA

```bash
cd frontend
pnpm build
pnpm preview
```

Open the preview URL and use the browser's "Install" option to install
CerebroSpeak as a standalone app.

## Project structure

cerebrospeak/
├── backend/
│   └── app/
│       ├── api/routers/    # HTTP endpoints
│       ├── services/       # business logic
│       ├── clients/        # AI provider integrations
│       ├── models/         # schemas + database tables
│       ├── prompts/        # versioned AI prompts
│       └── core/           # config, logging, middleware, exceptions
└── frontend/
└── src/
├── features/       # idle, session, grid, chat, summary, dashboard
├── stores/         # Zustand state
├── hooks/          # audio, TTS, scanning, wake-lock, prefetch
├── api/            # typed client + types
└── components/ui/  # clay UI primitives

## License

Private project.