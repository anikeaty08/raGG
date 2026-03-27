# Environment Variables

This doc lists the supported environment variables for both services.

## Backend (`backend/.env`)

### Required (minimum)

- `GEMINI_API_KEY`: Gemini API key (at least one LLM provider key is required).
- `QDRANT_URL`: Qdrant cluster URL.
- `QDRANT_API_KEY`: Qdrant API key.

### CORS

- `ALLOWED_ORIGINS`: Comma-separated list of allowed frontend origins. Defaults to a safe set for localhost and Vercel previews.

### Retrieval / chunking

- `MAX_CHUNK_SIZE`: Chunk size in characters (default `1000`).
- `CHUNK_OVERLAP`: Chunk overlap in characters (default `200`).

### Optional LLM providers

- `GROQ_API_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`

### Optional web search

- `TAVILY_API_KEY`
- `GOOGLE_SEARCH_API_KEY`
- `GOOGLE_SEARCH_ENGINE_ID`

### Optional auth

- `GOOGLE_CLIENT_ID`: Enables Google login if set.

### Optional production

- `REDIS_URL`: Redis connection string (used for rate limiting if configured).
- `SENTRY_DSN`: Enables Sentry error tracking if set.
- `ENVIRONMENT`: `development` (default) or `production`.

## Frontend (`frontend/.env.local`)

### Required

- `NEXT_PUBLIC_API_URL`: Backend base URL (example: `http://localhost:8000`).

### Optional

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google OAuth client ID (if auth is enabled).

