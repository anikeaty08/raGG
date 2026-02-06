import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.qdrant_url = os.getenv("QDRANT_URL", "")
        self.qdrant_api_key = os.getenv("QDRANT_API_KEY", "")
        self.allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
        self.max_chunk_size = int(os.getenv("MAX_CHUNK_SIZE", "1000"))
        self.chunk_overlap = int(os.getenv("CHUNK_OVERLAP", "200"))

    @property
    def cors_origins(self):
        return [o.strip() for o in self.allowed_origins.split(",")]


settings = Settings()


def get_settings():
    return settings
