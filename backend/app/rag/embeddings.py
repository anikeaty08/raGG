from google import genai
from google.genai import types
from app.config import get_settings

settings = get_settings()

# Initialize client
client = genai.Client(api_key=settings.gemini_api_key)


class GeminiEmbeddings:
    """
    Wrapper for Google Gemini embeddings API using new google-genai package.
    """

    def __init__(self):
        self.model = "text-embedding-004"

    def embed_text(self, text: str) -> list[float]:
        """Generate embedding for a single text."""
        response = client.models.embed_content(
            model=self.model,
            contents=text,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
        )
        return response.embeddings[0].values

    def embed_query(self, query: str) -> list[float]:
        """Generate embedding for a query."""
        response = client.models.embed_content(
            model=self.model,
            contents=query,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY")
        )
        return response.embeddings[0].values

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts."""
        all_embeddings = []

        # Process in smaller batches
        batch_size = 20
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            for text in batch:
                try:
                    response = client.models.embed_content(
                        model=self.model,
                        contents=text,
                        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
                    )
                    all_embeddings.append(response.embeddings[0].values)
                except Exception as e:
                    print(f"Error embedding text: {e}")
                    # Return zero vector on error
                    all_embeddings.append([0.0] * 768)

        return all_embeddings
