import os
import shutil
import tempfile
import uuid
from git import Repo
from pathlib import Path

from app.config import get_settings
from app.ingest.chunker import chunk_code, chunk_text
from app.rag.vectorstore import VectorStore

settings = get_settings()

# File extensions to process
CODE_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".go", ".rs",
    ".cpp", ".c", ".h", ".hpp", ".rb", ".php", ".swift", ".kt",
    ".scala", ".cs", ".vue", ".svelte"
}

DOC_EXTENSIONS = {".md", ".txt", ".rst", ".mdx"}

# Directories to skip
SKIP_DIRS = {
    "node_modules", ".git", "__pycache__", ".venv", "venv",
    "dist", "build", ".next", ".nuxt", "target", "bin", "obj",
    ".idea", ".vscode", "coverage", ".pytest_cache"
}

# Max file size to process (500KB)
MAX_FILE_SIZE = 500 * 1024


async def ingest_github_repo(
    url: str,
    branch: str,
    vector_store: VectorStore,
    user_id: str = "default"
) -> tuple[str, int]:
    """
    Clone and ingest a public GitHub repository.

    Returns:
        tuple: (source_id, number_of_chunks)
    """
    # Validate URL
    if not url.startswith(("https://github.com/", "http://github.com/")):
        raise ValueError("Invalid GitHub URL. Must start with https://github.com/")

    # Extract repo name
    repo_name = url.rstrip("/").split("/")[-1].replace(".git", "")
    source_id = str(uuid.uuid4())

    # Create temp directory
    temp_dir = tempfile.mkdtemp()

    try:
        # Clone the repository
        repo = Repo.clone_from(
            url,
            temp_dir,
            branch=branch,
            depth=1  # Shallow clone
        )

        all_chunks = []

        # Walk through the repository
        for root, dirs, files in os.walk(temp_dir):
            # Skip unwanted directories
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

            for file in files:
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, temp_dir)
                ext = Path(file).suffix.lower()

                # Skip large files
                if os.path.getsize(file_path) > MAX_FILE_SIZE:
                    continue

                # Process code files
                if ext in CODE_EXTENSIONS:
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()

                        if content.strip():
                            chunks = chunk_code(content, relative_path)
                            for chunk in chunks:
                                chunk["metadata"]["source_id"] = source_id
                                chunk["metadata"]["source_name"] = repo_name
                                chunk["metadata"]["source_type"] = "github"
                                chunk["metadata"]["file_path"] = relative_path
                            all_chunks.extend(chunks)
                    except Exception:
                        continue

                # Process documentation files
                elif ext in DOC_EXTENSIONS:
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()

                        if content.strip():
                            chunks = chunk_text(content)
                            for chunk in chunks:
                                chunk["metadata"]["source_id"] = source_id
                                chunk["metadata"]["source_name"] = repo_name
                                chunk["metadata"]["source_type"] = "github"
                                chunk["metadata"]["file_path"] = relative_path
                            all_chunks.extend(chunks)
                    except Exception:
                        continue

        if not all_chunks:
            raise ValueError("No processable files found in repository")

        # Add to vector store
        await vector_store.add_documents(all_chunks, source_id, repo_name, "github", user_id)

        return source_id, len(all_chunks)

    finally:
        # Cleanup temp directory
        shutil.rmtree(temp_dir, ignore_errors=True)
