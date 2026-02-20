import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Default allowed origins (localhost + common Vercel patterns)
    DEFAULT_ORIGINS = "http://localhost:3000,https://ra-gg.vercel.app,https://*.vercel.app"

    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.qdrant_url = os.getenv("QDRANT_URL", "")
        self.qdrant_api_key = os.getenv("QDRANT_API_KEY", "")
        self.allowed_origins = os.getenv("ALLOWED_ORIGINS", self.DEFAULT_ORIGINS)
        self.max_chunk_size = int(os.getenv("MAX_CHUNK_SIZE", "1000"))
        self.chunk_overlap = int(os.getenv("CHUNK_OVERLAP", "200"))
        
        # Multi-model API keys
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self.groq_api_key = os.getenv("GROQ_API_KEY", "")
        
        # Web search API keys
        self.tavily_api_key = os.getenv("TAVILY_API_KEY", "")
        self.google_search_api_key = os.getenv("GOOGLE_SEARCH_API_KEY", "")
        self.google_search_engine_id = os.getenv("GOOGLE_SEARCH_ENGINE_ID", "")
        
        # Production settings
        self.redis_url = os.getenv("REDIS_URL", "")
        self.sentry_dsn = os.getenv("SENTRY_DSN", "")
        self.environment = os.getenv("ENVIRONMENT", "development")

    @property
    def cors_origins(self):
        origins = [o.strip() for o in self.allowed_origins.split(",")]
        # Handle wildcard patterns for Vercel preview deployments
        return origins


settings = Settings()


def get_settings():
    return settings
