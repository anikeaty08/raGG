# Deployment Guide

This guide covers deploying the Agentic RAG System to production.

## Prerequisites

- Backend: Python 3.11+, FastAPI, Qdrant Cloud account
- Frontend: Node.js 18+, Next.js 14
- API Keys:
  - Qdrant Cloud (for vector database)
  - At least one LLM provider (Anthropic, OpenAI, Gemini, or Groq)
  - Tavily API (for web search, optional)
  - Google Search API (for web search fallback, optional)
  - Sentry DSN (for error tracking, optional)

## Environment Variables

### Backend (`backend/.env`)

```bash
# Qdrant Vector Database
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key

# LLM Providers (at least one required)
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key

# Web Search (optional)
TAVILY_API_KEY=your-tavily-key
GOOGLE_SEARCH_API_KEY=your-google-search-key
GOOGLE_SEARCH_ENGINE_ID=your-engine-id

# Production Settings
ENVIRONMENT=production
SENTRY_DSN=your-sentry-dsn
REDIS_URL=redis://localhost:6379  # Optional, for caching

# CORS
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://*.vercel.app

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=https://your-backend.render.com
```

## Backend Deployment (Render)

1. **Create a new Web Service** on Render
2. **Connect your GitHub repository**
3. **Configure:**
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3
4. **Add Environment Variables** (from above)
5. **Deploy**

## Frontend Deployment (Vercel)

1. **Import your GitHub repository** to Vercel
2. **Configure:**
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
3. **Add Environment Variables:**
   - `NEXT_PUBLIC_API_URL`: Your Render backend URL
4. **Deploy**

## Alternative: Docker Deployment

### Backend Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

CMD ["npm", "start"]
```

## Health Checks

After deployment, verify:

- Backend: `https://your-backend.render.com/health`
- Frontend: Should load and connect to backend

## Monitoring

- **Sentry**: Error tracking (if configured)
- **Metrics**: `/analytics/metrics` endpoint
- **Logs**: Check Render/Vercel logs

## Scaling

- **Backend**: Use Render's auto-scaling or increase instance size
- **Frontend**: Vercel handles scaling automatically
- **Database**: Qdrant Cloud scales automatically

## Troubleshooting

1. **CORS Errors**: Check `ALLOWED_ORIGINS` includes your frontend URL
2. **API Key Errors**: Verify all required API keys are set
3. **Connection Issues**: Ensure backend URL is correct in frontend env vars
4. **Rate Limiting**: Adjust `RATE_LIMIT_PER_MINUTE` if needed

## Security Checklist

- [ ] All API keys are set as environment variables (not in code)
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Sentry is configured for error tracking
- [ ] HTTPS is enabled (Render/Vercel default)
- [ ] Secrets are not exposed in logs
