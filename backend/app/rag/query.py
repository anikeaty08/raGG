from google import genai
from typing import Optional
from collections import defaultdict

from app.config import get_settings
from app.rag.vectorstore import VectorStore

settings = get_settings()

# Initialize client
client = genai.Client(api_key=settings.gemini_api_key)


class RAGQueryEngine:
    """RAG Query Engine using Gemini 2.0 Flash."""

    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store
        self.model = "gemini-2.0-flash"
        self.conversations: dict[str, list] = defaultdict(list)

    async def query(
        self,
        question: str,
        session_id: str,
        top_k: int = 5,
        source_filter: Optional[str] = None
    ) -> tuple[str, list[dict]]:
        """Process a query and return answer with citations."""

        try:
            # Retrieve relevant chunks
            results = await self.vector_store.search(
                query=question,
                top_k=top_k,
                source_filter=source_filter
            )

            if not results:
                return (
                    "I couldn't find any relevant information. Please add some sources first.",
                    []
                )

            # Build context
            context_parts = []
            for i, result in enumerate(results):
                metadata = result.get("metadata", {})
                source_info = self._format_source_info(metadata)
                context_parts.append(f"[Source {i + 1}: {source_info}]\n{result.get('content', '')}")

            context = "\n\n---\n\n".join(context_parts)

            # Build prompt
            prompt = f"""You are a helpful study assistant. Answer based ONLY on the provided context.

Rules:
1. Only use information from the context below
2. Cite sources using [Source N] notation
3. If info is not in context, say so
4. Be concise but thorough

Context:
{context}

Question: {question}

Answer:"""

            # Generate response
            try:
                response = client.models.generate_content(
                    model=self.model,
                    contents=prompt
                )
                answer = response.text if response.text else "Sorry, I couldn't generate a response."
            except Exception as e:
                print(f"Gemini generation error: {e}")
                answer = f"Error generating response. Please try again."

            # Format citations
            citations = []
            for result in results:
                metadata = result.get("metadata", {})
                citation = {
                    "source": str(metadata.get("file_path") or metadata.get("source_name") or "Unknown"),
                    "content": str(result.get("content", ""))[:200],
                }

                line_start = metadata.get("line_start")
                if line_start and str(line_start) not in ["None", ""]:
                    try:
                        citation["line"] = int(line_start)
                    except:
                        pass

                page = metadata.get("page")
                if page and str(page) not in ["None", ""]:
                    try:
                        citation["page"] = int(page)
                    except:
                        pass

                citations.append(citation)

            return answer, citations

        except Exception as e:
            print(f"Query error: {e}")
            return f"An error occurred: {str(e)}", []

    def _format_source_info(self, metadata: dict) -> str:
        """Format source information for display."""
        source_type = str(metadata.get("source_type", ""))
        source_name = str(metadata.get("source_name", "Unknown"))

        if source_type == "github":
            file_path = str(metadata.get("file_path", ""))
            line = metadata.get("line_start")
            if line and str(line) not in ["None", ""]:
                return f"{file_path}:{line}"
            return file_path
        elif source_type == "pdf":
            page = metadata.get("page")
            if page and str(page) not in ["None", ""]:
                return f"{source_name}, Page {page}"
            return source_name
        elif source_type == "web":
            return str(metadata.get("url", source_name))

        return source_name
