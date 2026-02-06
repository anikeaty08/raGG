from google import genai
from typing import Optional
from collections import defaultdict

from app.config import get_settings
from app.rag.vectorstore import VectorStore

settings = get_settings()

# Initialize client
client = genai.Client(api_key=settings.gemini_api_key)


class RAGQueryEngine:
    """RAG Query Engine using Gemini 2.5 models (free tier)."""

    # Models to try in order (Gemini 2.5 first, then fallbacks)
    MODELS = [
        "gemini-2.5-flash",      # Latest and best - free tier available
        "gemini-2.5-flash-lite", # Higher rate limits on free tier
        "gemini-2.0-flash",      # Fallback
    ]

    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store
        self.model = self.MODELS[0]  # Start with Gemini 2.5 Flash
        self.conversations: dict[str, list] = defaultdict(list)

    async def query(
        self,
        question: str,
        session_id: str,
        top_k: int = 5,
        source_filter: Optional[str] = None,
        user_id: str = "default"
    ) -> tuple[str, list[dict]]:
        """Process a query and return answer with citations."""

        try:
            # Retrieve relevant chunks (filtered by user_id)
            results = await self.vector_store.search(
                query=question,
                top_k=top_k,
                source_filter=source_filter,
                user_id=user_id
            )

            # If no sources, use general chat mode (no RAG, just Gemini)
            if not results:
                return await self._general_chat(question)

            # Build context
            context_parts = []
            for i, result in enumerate(results):
                metadata = result.get("metadata", {})
                source_info = self._format_source_info(metadata)
                context_parts.append(f"[Source {i + 1}: {source_info}]\n{result.get('content', '')}")

            context = "\n\n---\n\n".join(context_parts)

            # Build prompt
            prompt = f"""You are a friendly and knowledgeable study tutor helping a student learn.

Your job:
- Answer the question naturally and conversationally, like a helpful teacher would
- Use the context provided to inform your answer
- Explain concepts clearly with examples when helpful
- If the question has a typo (like "cllass" instead of "class"), understand what they meant and answer accordingly
- Don't be robotic - be warm and engaging
- Keep citations minimal - only add [Source N] at the end if directly quoting or for specific facts
- If the context doesn't have enough info, use your knowledge to help but mention what came from the sources

Context from uploaded materials:
{context}

Student's question: {question}

Give a helpful, natural response:"""

            # Generate response with fallback models
            answer = None
            last_error = None

            for model in self.MODELS:
                try:
                    print(f"Trying model: {model}")
                    response = client.models.generate_content(
                        model=model,
                        contents=prompt
                    )
                    answer = response.text if response.text else "Sorry, I couldn't generate a response."
                    self.model = model  # Remember working model
                    break
                except Exception as e:
                    last_error = e
                    print(f"Model {model} failed: {e}")
                    continue

            if answer is None:
                print(f"All models failed. Last error: {last_error}")
                answer = f"Error generating response. Please check your API key and try again."

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

    async def _general_chat(self, question: str) -> tuple[str, list[dict]]:
        """Handle general chat when no sources are available."""
        prompt = f"""You are a friendly and knowledgeable study tutor. Answer the student's question naturally and helpfully.

- Be conversational and warm, like a helpful teacher
- Explain concepts clearly with examples
- If they ask about something that would benefit from their own materials, gently suggest they can upload PDFs, GitHub repos, or URLs for personalized answers
- Keep responses focused and easy to understand

Student's question: {question}

Your helpful response:"""

        answer = None
        last_error = None

        for model in self.MODELS:
            try:
                print(f"General chat - Trying model: {model}")
                response = client.models.generate_content(
                    model=model,
                    contents=prompt
                )
                answer = response.text if response.text else "Sorry, I couldn't generate a response."
                self.model = model
                break
            except Exception as e:
                last_error = e
                print(f"Model {model} failed: {e}")
                continue

        if answer is None:
            print(f"All models failed. Last error: {last_error}")
            answer = "I'm having trouble connecting. Please try again in a moment."

        # No citations for general chat
        return answer, []
