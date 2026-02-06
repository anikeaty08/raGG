from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from contextlib import asynccontextmanager
import uuid
import asyncio
from datetime import datetime

from app.config import get_settings
from app.auth import get_user_id, get_current_user, GOOGLE_CLIENT_ID

# Global instances (initialized on startup)
vector_store = None
query_engine = None
cleanup_task = None


async def periodic_cleanup():
    """Background task to cleanup expired sources every 10 minutes."""
    while True:
        try:
            await asyncio.sleep(600)  # Wait 10 minutes
            if vector_store:
                deleted = vector_store.cleanup_expired_sources()
                if deleted > 0:
                    print(f"[{datetime.utcnow().isoformat()}] Auto-cleanup: Deleted {deleted} expired source(s)")
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Error in periodic cleanup: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize components on startup."""
    global vector_store, query_engine, cleanup_task

    try:
        from app.rag.vectorstore import VectorStore
        from app.rag.query import RAGQueryEngine

        vector_store = VectorStore()
        query_engine = RAGQueryEngine(vector_store)
        print("Successfully connected to Qdrant Cloud!")

        # Start background cleanup task
        cleanup_task = asyncio.create_task(periodic_cleanup())
        print("Started periodic cleanup task (runs every 10 minutes)")

        # Run initial cleanup
        deleted = vector_store.cleanup_expired_sources()
        if deleted > 0:
            print(f"Initial cleanup: Deleted {deleted} expired source(s)")

    except Exception as e:
        print(f"Warning: Could not initialize vector store: {e}")
        print("App will start but ingestion/query features may not work.")

    yield

    # Cleanup on shutdown
    if cleanup_task:
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="RAG Study Assistant API",
    description="Ingest GitHub repos, PDFs, and web content. Ask questions with cited answers. Data auto-deletes after 1 hour.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - Allow all origins (required for Vercel/Render deployment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # Must be False when using "*"
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========================
# Request/Response Models
# ========================

class GitHubIngestRequest(BaseModel):
    url: str
    branch: Optional[str] = "main"

class URLIngestRequest(BaseModel):
    url: str

class QueryRequest(BaseModel):
    question: str
    session_id: Optional[str] = None
    top_k: int = 5

class Citation(BaseModel):
    source: str
    content: str
    line: Optional[int] = None
    page: Optional[int] = None

class QueryResponse(BaseModel):
    answer: str
    citations: list[Citation]
    session_id: str

class SourceInfo(BaseModel):
    id: str
    name: str
    type: str
    chunks: int
    created_at: Optional[str] = None
    expires_at: Optional[str] = None

class IngestResponse(BaseModel):
    message: str
    source_id: str
    chunks_created: int

class CleanupResponse(BaseModel):
    deleted: int
    message: str


# ========================
# Health Check
# ========================

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "vector_store": "connected" if vector_store else "not connected",
        "data_retention_hours": 1
    }


# ========================
# Auth Endpoints
# ========================

@app.get("/auth/config")
async def get_auth_config():
    """Get auth configuration for frontend."""
    return {
        "google_client_id": GOOGLE_CLIENT_ID,
        "auth_enabled": bool(GOOGLE_CLIENT_ID)
    }


@app.get("/auth/me")
async def get_me(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    """Get current user info."""
    user = get_current_user(authorization)
    return {
        "user_id": user.get("user_id", x_user_id or "anonymous"),
        "email": user.get("email", ""),
        "name": user.get("name", "Guest"),
        "picture": user.get("picture", ""),
        "authenticated": bool(authorization and GOOGLE_CLIENT_ID)
    }


# ========================
# Ingest Endpoints
# ========================

@app.post("/ingest/github", response_model=IngestResponse)
async def ingest_github(
    request: GitHubIngestRequest,
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    """Ingest a public GitHub repository."""
    if not vector_store:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    user_id = get_user_id(authorization, x_user_id)

    try:
        from app.ingest.github import ingest_github_repo
        source_id, chunks = await ingest_github_repo(
            url=request.url,
            branch=request.branch,
            vector_store=vector_store,
            user_id=user_id
        )
        return IngestResponse(
            message=f"Successfully ingested repository",
            source_id=source_id,
            chunks_created=chunks
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/ingest/pdf", response_model=IngestResponse)
async def ingest_pdf_file(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    """Upload and ingest a PDF file."""
    if not vector_store:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    user_id = get_user_id(authorization, x_user_id)

    try:
        from app.ingest.pdf import ingest_pdf
        content = await file.read()
        source_id, chunks = await ingest_pdf(
            content=content,
            filename=file.filename,
            vector_store=vector_store,
            user_id=user_id
        )
        return IngestResponse(
            message=f"Successfully ingested PDF: {file.filename}",
            source_id=source_id,
            chunks_created=chunks
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/ingest/url", response_model=IngestResponse)
async def ingest_web_url(
    request: URLIngestRequest,
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    """Scrape and ingest content from a web URL."""
    if not vector_store:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    user_id = get_user_id(authorization, x_user_id)

    try:
        from app.ingest.web import ingest_url
        source_id, chunks = await ingest_url(
            url=request.url,
            vector_store=vector_store,
            user_id=user_id
        )
        return IngestResponse(
            message=f"Successfully ingested URL",
            source_id=source_id,
            chunks_created=chunks
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ========================
# Query Endpoint
# ========================

@app.post("/query", response_model=QueryResponse)
async def query(
    request: QueryRequest,
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    """Ask a question and get an answer with citations."""
    if not query_engine:
        raise HTTPException(status_code=503, detail="Query engine not initialized")

    session_id = request.session_id or str(uuid.uuid4())
    user_id = get_user_id(authorization, x_user_id)

    try:
        answer, citations = await query_engine.query(
            question=request.question,
            session_id=session_id,
            top_k=request.top_k,
            user_id=user_id
        )
        return QueryResponse(
            answer=answer,
            citations=[Citation(**c) for c in citations],
            session_id=session_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========================
# Source Management
# ========================

@app.get("/sources", response_model=list[SourceInfo])
async def list_sources(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    """List all ingested sources for the current user."""
    if not vector_store:
        return []

    user_id = get_user_id(authorization, x_user_id)
    sources = vector_store.list_sources(user_id)
    return [SourceInfo(**s) for s in sources]


@app.delete("/sources/{source_id}")
async def delete_source(
    source_id: str,
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    """Delete a source and its chunks (only if owned by user)."""
    if not vector_store:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    user_id = get_user_id(authorization, x_user_id)

    try:
        vector_store.delete_source(source_id, user_id)
        return {"message": f"Source {source_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.delete("/sources")
async def clear_all_sources(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    """Delete all sources for the current user."""
    if not vector_store:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    user_id = get_user_id(authorization, x_user_id)
    # Get user's sources and delete them one by one
    sources = vector_store.list_sources(user_id)
    for source in sources:
        vector_store.delete_source(source["id"], user_id)
    return {"message": "All your sources cleared"}


@app.post("/sources/cleanup", response_model=CleanupResponse)
async def cleanup_expired():
    """Manually trigger cleanup of expired sources."""
    if not vector_store:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    deleted = vector_store.cleanup_expired_sources()
    return CleanupResponse(
        deleted=deleted,
        message=f"Cleanup complete. Deleted {deleted} expired source(s)."
    )
