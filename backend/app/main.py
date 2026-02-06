from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from contextlib import asynccontextmanager
import uuid
import asyncio
from datetime import datetime

from app.config import get_settings

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

# CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
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
# Ingest Endpoints
# ========================

@app.post("/ingest/github", response_model=IngestResponse)
async def ingest_github(request: GitHubIngestRequest):
    """Ingest a public GitHub repository."""
    if not vector_store:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    try:
        from app.ingest.github import ingest_github_repo
        source_id, chunks = await ingest_github_repo(
            url=request.url,
            branch=request.branch,
            vector_store=vector_store
        )
        return IngestResponse(
            message=f"Successfully ingested repository",
            source_id=source_id,
            chunks_created=chunks
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/ingest/pdf", response_model=IngestResponse)
async def ingest_pdf_file(file: UploadFile = File(...)):
    """Upload and ingest a PDF file."""
    if not vector_store:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    try:
        from app.ingest.pdf import ingest_pdf
        content = await file.read()
        source_id, chunks = await ingest_pdf(
            content=content,
            filename=file.filename,
            vector_store=vector_store
        )
        return IngestResponse(
            message=f"Successfully ingested PDF: {file.filename}",
            source_id=source_id,
            chunks_created=chunks
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/ingest/url", response_model=IngestResponse)
async def ingest_web_url(request: URLIngestRequest):
    """Scrape and ingest content from a web URL."""
    if not vector_store:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    try:
        from app.ingest.web import ingest_url
        source_id, chunks = await ingest_url(
            url=request.url,
            vector_store=vector_store
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
async def query(request: QueryRequest):
    """Ask a question and get an answer with citations."""
    if not query_engine:
        raise HTTPException(status_code=503, detail="Query engine not initialized")

    session_id = request.session_id or str(uuid.uuid4())

    try:
        answer, citations = await query_engine.query(
            question=request.question,
            session_id=session_id,
            top_k=request.top_k
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
async def list_sources():
    """List all ingested sources."""
    if not vector_store:
        return []

    sources = vector_store.list_sources()
    return [SourceInfo(**s) for s in sources]


@app.delete("/sources/{source_id}")
async def delete_source(source_id: str):
    """Delete a source and its chunks."""
    if not vector_store:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    try:
        vector_store.delete_source(source_id)
        return {"message": f"Source {source_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.delete("/sources")
async def clear_all_sources():
    """Delete all sources and reset the vector store."""
    if not vector_store:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    vector_store.clear_all()
    return {"message": "All sources cleared"}


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
