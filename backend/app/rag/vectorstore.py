from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue, PointIdsList, Range
)
import uuid
from typing import Optional
from datetime import datetime, timedelta

from app.config import get_settings
from app.rag.embeddings import GeminiEmbeddings

settings = get_settings()


class VectorStore:
    """
    Qdrant Cloud vector store for document storage and retrieval.
    Free tier: 1GB storage, perfect for study projects.
    Includes auto-cleanup of data after 1 hour.
    """

    COLLECTION_NAME = "rag_documents"
    SOURCES_COLLECTION = "sources_metadata"
    VECTOR_SIZE = 768  # Gemini embedding size
    DATA_RETENTION_HOURS = 1  # Auto-delete after 1 hour

    def __init__(self):
        # Initialize Qdrant Cloud client
        self.client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            timeout=60
        )

        # Initialize embeddings
        self.embeddings = GeminiEmbeddings()

        # Create collections if they don't exist
        self._init_collections()

    def _init_collections(self):
        """Initialize Qdrant collections."""
        try:
            collections = [c.name for c in self.client.get_collections().collections]

            # Main documents collection
            if self.COLLECTION_NAME not in collections:
                self.client.create_collection(
                    collection_name=self.COLLECTION_NAME,
                    vectors_config=VectorParams(
                        size=self.VECTOR_SIZE,
                        distance=Distance.COSINE
                    )
                )

            # Sources metadata collection
            if self.SOURCES_COLLECTION not in collections:
                self.client.create_collection(
                    collection_name=self.SOURCES_COLLECTION,
                    vectors_config=VectorParams(
                        size=self.VECTOR_SIZE,
                        distance=Distance.COSINE
                    )
                )
        except Exception as e:
            print(f"Error initializing collections: {e}")
            raise

    async def add_documents(
        self,
        chunks: list[dict],
        source_id: str,
        source_name: str,
        source_type: str
    ) -> None:
        """
        Add document chunks to the vector store.
        Includes timestamp for auto-cleanup.
        """
        if not chunks:
            return

        # Current timestamp for data retention
        created_at = datetime.utcnow().isoformat()
        expires_at = (datetime.utcnow() + timedelta(hours=self.DATA_RETENTION_HOURS)).isoformat()

        # Extract texts for embedding
        texts = [chunk["content"] for chunk in chunks]

        # Generate embeddings
        embeddings = self.embeddings.embed_batch(texts)

        # Prepare points for Qdrant
        points = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            metadata = chunk.get("metadata", {})
            # Convert all metadata values to strings for Qdrant
            clean_metadata = {}
            for k, v in metadata.items():
                if v is not None:
                    clean_metadata[k] = str(v) if not isinstance(v, (str, int, float, bool)) else v

            clean_metadata["source_id"] = source_id
            clean_metadata["source_name"] = source_name
            clean_metadata["source_type"] = source_type
            clean_metadata["content"] = chunk["content"]
            clean_metadata["created_at"] = created_at
            clean_metadata["expires_at"] = expires_at

            points.append(PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload=clean_metadata
            ))

        # Upsert to Qdrant in batches
        batch_size = 100
        for i in range(0, len(points), batch_size):
            batch = points[i:i + batch_size]
            self.client.upsert(
                collection_name=self.COLLECTION_NAME,
                points=batch
            )

        # Track source metadata with timestamps
        source_embedding = self.embeddings.embed_text(source_name)
        self.client.upsert(
            collection_name=self.SOURCES_COLLECTION,
            points=[PointStruct(
                id=source_id,
                vector=source_embedding,
                payload={
                    "name": source_name,
                    "type": source_type,
                    "chunks": len(chunks),
                    "created_at": created_at,
                    "expires_at": expires_at
                }
            )]
        )

    async def search(
        self,
        query: str,
        top_k: int = 5,
        source_filter: Optional[str] = None
    ) -> list[dict]:
        """
        Search for relevant documents.
        """
        # Generate query embedding
        query_embedding = self.embeddings.embed_query(query)

        # Build filter if source specified
        search_filter = None
        if source_filter:
            search_filter = Filter(
                must=[
                    FieldCondition(
                        key="source_id",
                        match=MatchValue(value=source_filter)
                    )
                ]
            )

        # Search
        results = self.client.search(
            collection_name=self.COLLECTION_NAME,
            query_vector=query_embedding,
            query_filter=search_filter,
            limit=top_k,
            with_payload=True
        )

        # Format results
        formatted = []
        for result in results:
            payload = result.payload or {}
            formatted.append({
                "content": payload.get("content", ""),
                "metadata": {k: v for k, v in payload.items() if k != "content"},
                "score": result.score
            })

        return formatted

    def list_sources(self) -> list[dict]:
        """
        List all ingested sources.
        """
        try:
            # Scroll through all sources
            results = self.client.scroll(
                collection_name=self.SOURCES_COLLECTION,
                limit=100,
                with_payload=True
            )

            sources = []
            if results and results[0]:
                for point in results[0]:
                    payload = point.payload or {}
                    sources.append({
                        "id": str(point.id),
                        "name": payload.get("name", "Unknown"),
                        "type": payload.get("type", "unknown"),
                        "chunks": payload.get("chunks", 0),
                        "created_at": payload.get("created_at"),
                        "expires_at": payload.get("expires_at")
                    })

            return sources
        except Exception as e:
            print(f"Error listing sources: {e}")
            return []

    def delete_source(self, source_id: str) -> None:
        """
        Delete a source and all its chunks.
        """
        # First, find all point IDs with this source_id
        results = self.client.scroll(
            collection_name=self.COLLECTION_NAME,
            scroll_filter=Filter(
                must=[
                    FieldCondition(
                        key="source_id",
                        match=MatchValue(value=source_id)
                    )
                ]
            ),
            limit=10000,
            with_payload=False
        )

        if results and results[0]:
            point_ids = [str(point.id) for point in results[0]]
            if point_ids:
                self.client.delete(
                    collection_name=self.COLLECTION_NAME,
                    points_selector=PointIdsList(points=point_ids)
                )

        # Delete from sources collection
        try:
            self.client.delete(
                collection_name=self.SOURCES_COLLECTION,
                points_selector=PointIdsList(points=[source_id])
            )
        except Exception:
            pass

    def cleanup_expired_sources(self) -> int:
        """
        Delete all sources that have expired (older than DATA_RETENTION_HOURS).
        Returns the number of sources deleted.
        """
        try:
            current_time = datetime.utcnow().isoformat()
            deleted_count = 0

            # Get all sources
            sources = self.list_sources()

            for source in sources:
                expires_at = source.get("expires_at")
                if expires_at and expires_at < current_time:
                    # Source has expired, delete it
                    self.delete_source(source["id"])
                    deleted_count += 1
                    print(f"Auto-deleted expired source: {source['name']}")

            return deleted_count
        except Exception as e:
            print(f"Error during cleanup: {e}")
            return 0

    def clear_all(self) -> None:
        """
        Clear all data from the vector store.
        """
        try:
            # Delete and recreate collections
            self.client.delete_collection(self.COLLECTION_NAME)
            self.client.delete_collection(self.SOURCES_COLLECTION)
            self._init_collections()
        except Exception as e:
            print(f"Error clearing collections: {e}")
            raise
