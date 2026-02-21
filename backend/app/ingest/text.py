"""Ingest raw text as a source."""
import uuid

from app.ingest.chunker import chunk_text
from app.rag.vectorstore import VectorStore


async def ingest_text(
    text: str,
    vector_store: VectorStore,
    user_id: str = "default",
    name: str | None = None,
) -> tuple[str, int]:
    """
    Ingest raw text into the vector store.

    Args:
        text: Raw text content to ingest
        vector_store: VectorStore instance
        user_id: User ID for data isolation
        name: Optional display name for the source

    Returns:
        tuple: (source_id, number_of_chunks)
    """
    if not text or not text.strip():
        raise ValueError("Text cannot be empty")

    source_id = str(uuid.uuid4())
    source_name = name or "Pasted text"

    chunks = chunk_text(text)

    for chunk in chunks:
        chunk["metadata"]["source_id"] = source_id
        chunk["metadata"]["source_name"] = source_name
        chunk["metadata"]["source_type"] = "text"

    await vector_store.add_documents(chunks, source_id, source_name, "text", user_id)

    return source_id, len(chunks)
