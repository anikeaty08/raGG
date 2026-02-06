# RAG Study Assistant

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_2.0-4285F4?style=flat-square&logo=google&logoColor=white)
![Qdrant](https://img.shields.io/badge/Qdrant-DC382D?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=flat-square&logo=python&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Cost](https://img.shields.io/badge/Cost-Free-success?style=flat-square)

**AI-powered study assistant that ingests GitHub repos, PDFs & web docs — answers questions with citations.**

[Live Demo](https://your-app.vercel.app) • [API Docs](https://your-api.onrender.com/docs)

</div>

---

## Features

- **Multi-source ingestion** — GitHub repos, PDFs, web pages
- **Cited answers** — Every response includes source references
- **Conversation memory** — Follow-up questions work seamlessly
- **Beautiful UI** — 3D animations, glassmorphism, dark mode
- **100% Free** — Uses free tiers of all services

---

## Tech Stack

| Frontend | Backend | AI/ML | Database |
|----------|---------|-------|----------|
| Next.js 14 | FastAPI | Gemini 2.0 Flash | Qdrant Cloud |
| Tailwind CSS | Python 3.10+ | Text Embedding 004 | Free 1GB |
| Framer Motion | Uvicorn | — | — |

---

## Project Structure

```
rag-study-assistant/
├── backend/
│   ├── app/
│   │   ├── main.py          # API endpoints
│   │   ├── config.py        # Settings
│   │   ├── ingest/          # GitHub, PDF, Web parsers
│   │   └── rag/             # Embeddings, Vector store, Query
│   ├── .env                 # API keys (create this)
│   └── requirements.txt
├── frontend/
│   ├── src/app/             # Next.js pages
│   ├── src/components/      # React components
│   └── .env.local           # Frontend config
└── README.md
```

---

## Quick Start

### 1. Get API Keys (Free)

| Service | URL | Get |
|---------|-----|-----|
| Gemini | [aistudio.google.com](https://aistudio.google.com) | API Key |
| Qdrant | [cloud.qdrant.io](https://cloud.qdrant.io) | URL + API Key |

### 2. Backend Setup

```bash
cd backend
python -m venv venv && venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

Create `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_key
QDRANT_URL=https://xxx.qdrant.io
QDRANT_API_KEY=your_qdrant_key
ALLOWED_ORIGINS=http://localhost:3000
```

Run: `uvicorn app.main:app --reload --port 8000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run: `npm run dev`

Open: **http://localhost:3000**

---

## Deployment

### Backend → Render.com (Free)

1. Push to GitHub
2. New Web Service → Connect repo
3. Root: `backend` | Build: `pip install -r requirements.txt`
4. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add env variables

### Frontend → Vercel.com (Free)

1. Import repo → Root: `frontend`
2. Add: `NEXT_PUBLIC_API_URL=https://your-api.onrender.com`
3. Deploy

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ingest/github` | Ingest GitHub repo |
| POST | `/ingest/pdf` | Upload PDF |
| POST | `/ingest/url` | Scrape web URL |
| POST | `/query` | Ask a question |
| GET | `/sources` | List sources |
| DELETE | `/sources/{id}` | Delete source |

---

## License

MIT License — free to use, modify, and distribute.

---

<div align="center">
Made with ❤️ for learners everywhere
</div>
