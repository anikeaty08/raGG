import re
from typing import Optional


def extract_repo_info(github_url: str) -> tuple[str, str]:
    """
    Extract owner and repo name from GitHub URL.

    Args:
        github_url: Full GitHub URL

    Returns:
        tuple: (owner, repo_name)
    """
    # Handle various GitHub URL formats
    patterns = [
        r"github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$",
        r"github\.com/([^/]+)/([^/]+?)(?:/tree/[^/]+)?/?$",
    ]

    for pattern in patterns:
        match = re.search(pattern, github_url)
        if match:
            return match.group(1), match.group(2)

    raise ValueError(f"Could not parse GitHub URL: {github_url}")


def truncate_text(text: str, max_length: int = 500) -> str:
    """
    Truncate text to max length, adding ellipsis if needed.
    """
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."


def clean_text(text: str) -> str:
    """
    Clean and normalize text.
    """
    # Remove excessive whitespace
    text = re.sub(r"\s+", " ", text)
    # Remove null characters
    text = text.replace("\x00", "")
    return text.strip()


def is_binary_file(file_path: str) -> bool:
    """
    Check if a file is likely binary based on extension.
    """
    binary_extensions = {
        ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg",
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".zip", ".tar", ".gz", ".rar", ".7z",
        ".exe", ".dll", ".so", ".dylib",
        ".mp3", ".mp4", ".wav", ".avi", ".mov",
        ".ttf", ".woff", ".woff2", ".eot",
        ".pyc", ".pyo", ".class", ".o",
    }

    ext = "." + file_path.split(".")[-1].lower() if "." in file_path else ""
    return ext in binary_extensions


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human-readable format.
    """
    for unit in ["B", "KB", "MB", "GB"]:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"
