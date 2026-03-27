# Agentic RAG System (raGG)

A production-minded, agentic RAG (Retrieval Augmented Generation) system with multi-model support, optional web search, and a streaming chat UI.

## Features

### Multi-Model Support
- **Anthropic Claude**
- **OpenAI**
- **Google Gemini**
- **Groq**

### Agentic Capabilities
- **Query Planning**: query decomposition and execution planning
- **Multi-Hop Retrieval**: iterative retrieval with query expansion and re-ranking
- **Tool Use**: web search, code execution, calculator, file operations
- **Self-Reflection**: answer verification and quality assessment

### Frontend
- Streaming responses (token-by-token)
- Model/provider selection
- Multi-session chat
- Tool usage + web search result display
- Dark/light theme

### Production
- Rate limiting
- Structured logging (request IDs)
- Security middleware (CORS, headers, validation)
- Optional Sentry integration
- Basic usage metrics endpoints

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Qdrant Cloud account (or self-hosted Qdrant)
- At least one LLM provider API key

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Verify:
- `GET http://localhost:8000/health`
- `GET http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## API Endpoints (high level)

- Query: `POST /query`, `POST /query/stream` (SSE)
- Ingest: `POST /ingest/github`, `POST /ingest/pdf`, `POST /ingest/url`, `POST /ingest/text`
- Sources: `GET /sources`, `DELETE /sources/{source_id}`, `DELETE /sources`, `POST /sources/cleanup`
- Settings: `GET /settings/model`, `POST /settings/model`, `GET /settings/providers`, `GET /settings/providers/working`
- Analytics: `GET /analytics/metrics`, `GET /analytics/providers/{provider}`

## Architecture (simplified)

```
User Query
  |
Agentic RAG Engine
  |
Planner -> Router -> Multi-hop Retrieval
  |
Tool Executor (Web search / Code exec / Calculator)
  |
LLM Provider
  |
Verifier / Self-reflection
  |
Final Response
```

## Documentation

- `DEPLOYMENT.md`: local + Docker + Render + Vercel notes
- `ENV_VARS.md`: backend + frontend environment variables
- `API.md`: endpoint summary + Swagger/OpenAPI locations

## Testing

There are no automated test suites checked into this repo yet.

## License

MIT

