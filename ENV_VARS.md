# Environment Variables Reference

Complete list of environment variables for the Agentic RAG System.

## Backend Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `QDRANT_URL` | Qdrant Cloud cluster URL | `https://xxx.qdrant.io` |
| `QDRANT_API_KEY` | Qdrant Cloud API key | `your-api-key` |

### LLM Providers (At least one required)

| Variable | Description | Example |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | `sk-ant-xxx` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-xxx` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `GROQ_API_KEY` | Groq API key | `gsk_xxx` |

### Web Search (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `TAVILY_API_KEY` | Tavily API key for web search | `tvly-xxx` |
| `GOOGLE_SEARCH_API_KEY` | Google Custom Search API key | `AIza...` |
| `GOOGLE_SEARCH_ENGINE_ID` | Google Custom Search Engine ID | `xxxxx` |

### Production Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Environment name (`development`, `production`) | `development` |
| `SENTRY_DSN` | Sentry DSN for error tracking | - |
| `REDIS_URL` | Redis URL for caching (optional) | - |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:3000` |
| `RATE_LIMIT_PER_MINUTE` | Rate limit per minute | `60` |
| `RATE_LIMIT_PER_HOUR` | Rate limit per hour | `1000` |
| `MAX_CHUNK_SIZE` | Maximum chunk size for ingestion | `1000` |
| `CHUNK_OVERLAP` | Chunk overlap size | `200` |

## Frontend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

## Getting API Keys

### Qdrant Cloud
1. Sign up at https://cloud.qdrant.io
2. Create a cluster
3. Get URL and API key from dashboard

### Anthropic
1. Sign up at https://console.anthropic.com
2. Create API key

### OpenAI
1. Sign up at https://platform.openai.com
2. Create API key

### Gemini
1. Sign up at https://makersuite.google.com/app/apikey
2. Create API key

### Groq
1. Sign up at https://console.groq.com
2. Create API key

### Tavily
1. Sign up at https://tavily.com
2. Get API key from dashboard

### Google Search
1. Go to https://programmablesearchengine.google.com
2. Create a Custom Search Engine
3. Get API key from Google Cloud Console
4. Get Engine ID from CSE settings

### Sentry
1. Sign up at https://sentry.io
2. Create a project
3. Get DSN from project settings
