import uuid
import tempfile
import os
import fitz  # PyMuPDF

from app.ingest.chunker import chunk_pdf_page
from app.rag.vectorstore import VectorStore


async def ingest_pdf(
    content: bytes,
    filename: str,
    vector_store: VectorStore,
    user_id: str = "default"
) -> tuple[str, int]:
    """
    Extract text from PDF and ingest into vector store.

    Args:
        content: PDF file bytes
        filename: Original filename
        vector_store: VectorStore instance
        user_id: User ID for data isolation

    Returns:
        tuple: (source_id, number_of_chunks)
    """
    source_id = str(uuid.uuid4())
    all_chunks = []

    # Write to temp file (PyMuPDF needs a file path)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Open PDF
        doc = fitz.open(tmp_path)

        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()

            if text.strip():
                # Chunk the page text
                chunks = chunk_pdf_page(
                    text=text,
                    page_number=page_num + 1,  # 1-indexed
                    source_name=filename
                )

                for chunk in chunks:
                    chunk["metadata"]["source_id"] = source_id
                    chunk["metadata"]["source_name"] = filename
                    chunk["metadata"]["source_type"] = "pdf"

                all_chunks.extend(chunks)

        doc.close()

        if not all_chunks:
            raise ValueError("No text content found in PDF")

        # Add to vector store
        await vector_store.add_documents(all_chunks, source_id, filename, "pdf", user_id)

        return source_id, len(all_chunks)

    finally:
        # Cleanup temp file
        os.unlink(tmp_path)
