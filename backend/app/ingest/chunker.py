from app.config import get_settings

settings = get_settings()


def chunk_text(
    text: str,
    chunk_size: int = None,
    chunk_overlap: int = None
) -> list[dict]:
    """Split text into overlapping chunks."""
    chunk_size = chunk_size or settings.max_chunk_size
    chunk_overlap = chunk_overlap or settings.chunk_overlap

    if not text or not text.strip():
        return []

    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = start + chunk_size

        # Try to break at a natural boundary
        if end < text_len:
            # Look for paragraph break
            para_break = text.rfind('\n\n', start, end)
            if para_break > start + chunk_size // 2:
                end = para_break + 2
            else:
                # Look for sentence break
                sent_break = text.rfind('. ', start, end)
                if sent_break > start + chunk_size // 2:
                    end = sent_break + 2
                else:
                    # Look for line break
                    line_break = text.rfind('\n', start, end)
                    if line_break > start + chunk_size // 2:
                        end = line_break + 1

        chunk_text = text[start:end].strip()
        if chunk_text:
            chunks.append({
                "content": chunk_text,
                "metadata": {
                    "chunk_index": len(chunks),
                    "char_start": start
                }
            })

        start = end - chunk_overlap
        if start >= text_len:
            break

    return chunks


def chunk_code(
    code: str,
    file_path: str,
    chunk_size: int = None,
    chunk_overlap: int = None
) -> list[dict]:
    """Split code into chunks, trying to preserve function boundaries."""
    chunk_size = chunk_size or settings.max_chunk_size
    chunk_overlap = chunk_overlap or settings.chunk_overlap

    if not code or not code.strip():
        return []

    chunks = []
    lines = code.split('\n')
    current_chunk = []
    current_size = 0
    chunk_start_line = 1

    for i, line in enumerate(lines):
        line_with_newline = line + '\n'
        line_size = len(line_with_newline)

        if current_size + line_size > chunk_size and current_chunk:
            # Save current chunk
            chunk_content = ''.join(current_chunk).strip()
            if chunk_content:
                chunks.append({
                    "content": chunk_content,
                    "metadata": {
                        "file_path": file_path,
                        "chunk_index": len(chunks),
                        "line_start": chunk_start_line
                    }
                })

            # Start new chunk with overlap
            overlap_lines = current_chunk[-3:] if len(current_chunk) > 3 else current_chunk
            current_chunk = overlap_lines.copy()
            current_size = sum(len(l) for l in current_chunk)
            chunk_start_line = max(1, i - len(overlap_lines) + 2)

        current_chunk.append(line_with_newline)
        current_size += line_size

    # Don't forget last chunk
    if current_chunk:
        chunk_content = ''.join(current_chunk).strip()
        if chunk_content:
            chunks.append({
                "content": chunk_content,
                "metadata": {
                    "file_path": file_path,
                    "chunk_index": len(chunks),
                    "line_start": chunk_start_line
                }
            })

    return chunks


def chunk_pdf_page(
    text: str,
    page_number: int,
    source_name: str,
    chunk_size: int = None,
    chunk_overlap: int = None
) -> list[dict]:
    """Chunk text from a PDF page."""
    base_chunks = chunk_text(text, chunk_size, chunk_overlap)

    for chunk in base_chunks:
        chunk["metadata"]["source"] = source_name
        chunk["metadata"]["page"] = page_number

    return base_chunks
