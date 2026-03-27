# API Reference

Base URL (local): `http://localhost:8000`

Interactive docs:

- Swagger UI: `GET /docs`
- OpenAPI JSON: `GET /openapi.json`

## Health

- `GET /`: Basic connectivity + version info.
- `GET /health`: Health + initialization status.

## Auth

- `GET /auth/config`: Returns whether auth is enabled and the Google client ID (if configured).
- `GET /auth/me`: Returns the current user (based on headers).

## Ingestion

- `POST /ingest/github`: Ingest a public GitHub repo (`url`, optional `branch`).
- `POST /ingest/pdf`: Upload and ingest a file (`.pdf`, `.xlsx`, `.xls`, `.csv`).
- `POST /ingest/url`: Scrape and ingest a web URL.
- `POST /ingest/text`: Ingest raw text content.

## Query

- `POST /query`: Query the system (optionally agentic + web search).
- `POST /query/stream`: Stream responses as server-sent events (SSE).

## Sources

- `GET /sources`: List sources.
- `DELETE /sources/{source_id}`: Delete a single source.
- `DELETE /sources`: Delete all sources (optionally filtered by user).
- `POST /sources/cleanup`: Cleanup expired sources.

## Settings

- `GET /settings/model`: Current provider/model.
- `POST /settings/model`: Switch provider/model.
- `GET /settings/providers`: Available providers + models.
- `GET /settings/providers/working`: Probe configured providers; returns only working ones.

## Conversations

- `POST /conversations/{session_id}/clear`: Clear conversation state for a session.

## Analytics

- `GET /analytics/metrics`: Aggregate usage metrics.
- `GET /analytics/providers/{provider}`: Provider-specific metrics.

