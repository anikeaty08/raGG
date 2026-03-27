# Deployment Guide

This repo has two services:

- `backend/`: FastAPI API (Dockerfile included)
- `frontend/`: Next.js web app

## Local development

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Verify: `GET http://localhost:8000/health` and `GET http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open: `http://localhost:3000`.

## Docker (backend)

Build and run the backend container:

```bash
cd backend
docker build -t ragg-backend .
docker run --rm -p 8000:8000 --env-file .env ragg-backend
```

## Render (backend)

The backend includes `backend/render.yaml` for a Docker-based Render deployment.

1. Create a new Render Web Service.
2. Point it at this repo and set the root directory to `backend`.
3. Configure required environment variables (see `ENV_VARS.md`).
4. Render health check should use `/health`.

## Vercel (frontend)

1. Deploy `frontend/` to Vercel.
2. Set `NEXT_PUBLIC_API_URL` to your backend base URL.
3. (Optional) Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` if auth is enabled.

