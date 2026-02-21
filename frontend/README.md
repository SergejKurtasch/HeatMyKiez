# ViabCheck / Eco — Frontend (MVP)

React + TypeScript + Vite. Four-step wizard (address → define retrofits → retrofit suggestion → register/request). Connects to Eco FastAPI backend.

**Design (Figma):** [Eco UI — Untitled Copy](https://www.figma.com/design/TT6j8piAz9amjVWhXdzBVK/Untitled--Copy-?node-id=0-1&p=f&t=ZaJ1z7VQsh1hL0Nj-0). Use this link for layout, components, and typography when implementing or refining the UI.

## Setup

```bash
npm install
```

## Dev

```bash
npm run dev
```

Runs on port 5173. API requests are proxied to `http://localhost:8001` (set `VITE_API_URL` to override).

## Build

```bash
npm run build
```

Output in `dist/`.

## Backend

Start the FastAPI backend from the project root:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

(If port 8001 is in use, try 8002 or run `lsof -i :8000` then `kill <PID>` to free 8000 and use `--port 8000`; then set proxy in `vite.config.ts` back to 8000.)

**OpenAPI (contract):** http://localhost:8001/docs and http://localhost:8001/openapi.json
