from google import genai
from google.genai import types
from app.config import get_settings

settings = get_settings()

client = genai.Client(api_key=settings.gemini_api_key) if settings.gemini_api_key else None


class GeminiEmbeddings:
    """
    Wrapper for Google Gemini embeddings API using new google-genai package.
    Uses gemini-embedding-001 (3072 dimensions) - the latest embedding model.
    """

    # Embedding models to try in order
    MODELS = [
        "gemini-embedding-001",  # Latest model (3072 dims)
        "text-embedding-004",    # Fallback
    ]
    VECTOR_SIZE = 3072  # gemini-embedding-001 uses 3072 dimensions

    def __init__(self):
        self.model = self.MODELS[0]
        if client:
            self._test_model()

    def _test_model(self):
        """Test which embedding model is available."""
        if not client:
            return
        for model in self.MODELS:
            try:
                response = client.models.embed_content(
                    model=model,
                    contents="test"
                )
                self.model = model
                # Update vector size based on actual response
                if response.embeddings and response.embeddings[0].values:
                    GeminiEmbeddings.VECTOR_SIZE = len(response.embeddings[0].values)
                print(f"Using embedding model: {model} (dim={GeminiEmbeddings.VECTOR_SIZE})")
                return
            except Exception as e:
                print(f"Model {model} not available: {e}")
                continue
        print("Warning: No embedding model available!")

    def embed_text(self, text: str) -> list[float]:
        """Generate embedding for a single text."""
        if not client:
            return [0.0] * self.VECTOR_SIZE
        try:
            response = client.models.embed_content(
                model=self.model,
                contents=text,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
            )
            return response.embeddings[0].values
        except Exception as e:
            print(f"Error embedding text: {e}")
            return [0.0] * self.VECTOR_SIZE

    def embed_query(self, query: str) -> list[float]:
        """Generate embedding for a query."""
        if not client:
            return [0.0] * self.VECTOR_SIZE
        try:
            response = client.models.embed_content(
                model=self.model,
                contents=query,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY")
            )
            return response.embeddings[0].values
        except Exception as e:
            print(f"Error embedding query: {e}")
            return [0.0] * self.VECTOR_SIZE

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts."""
        all_embeddings = []

        # Process in smaller batches
        batch_size = 20
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            for text in batch:
                if not client:
                    all_embeddings.append([0.0] * self.VECTOR_SIZE)
                else:
                    try:
                        response = client.models.embed_content(
                            model=self.model,
                            contents=text,
                            config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
                        )
                        all_embeddings.append(response.embeddings[0].values)
                    except Exception as e:
                        print(f"Error embedding text: {e}")
                        all_embeddings.append([0.0] * self.VECTOR_SIZE)

        return all_embeddings
