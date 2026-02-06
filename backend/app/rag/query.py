from google import genai
from groq import Groq
from typing import Optional
from collections import defaultdict
import os

from app.config import get_settings
from app.rag.vectorstore import VectorStore

settings = get_settings()

# Initialize clients
gemini_client = genai.Client(api_key=settings.gemini_api_key)
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))


class RAGQueryEngine:
    """RAG Query Engine supporting multiple LLM providers."""

    # Available providers and their models
    PROVIDERS = {
        "gemini": {
            "models": ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"],
            "default": "gemini-2.5-flash"
        },
        "groq": {
            "models": ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
            "default": "llama-3.1-70b-versatile"
        }
    }

    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store
        self.conversations: dict[str, list] = defaultdict(list)

        # Set default provider based on available API keys
        if os.getenv("GROQ_API_KEY"):
            self.provider = "groq"
            self.model = self.PROVIDERS["groq"]["default"]
        else:
            self.provider = "gemini"
            self.model = self.PROVIDERS["gemini"]["default"]

        print(f"RAG Engine initialized with provider: {self.provider}, model: {self.model}")

    def set_provider(self, provider: str, model: str = None):
        """Switch LLM provider."""
        if provider not in self.PROVIDERS:
            raise ValueError(f"Unknown provider: {provider}")

        self.provider = provider
        self.model = model or self.PROVIDERS[provider]["default"]
        print(f"Switched to provider: {self.provider}, model: {self.model}")

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

            # If no sources, use general chat mode
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

            # Generate response
            answer = await self._generate(prompt)

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

    async def _generate(self, prompt: str) -> str:
        """Generate response using the current provider."""

        if self.provider == "groq":
            return await self._generate_groq(prompt)
        else:
            return await self._generate_gemini(prompt)

    async def _generate_gemini(self, prompt: str) -> str:
        """Generate using Gemini."""
        for model in self.PROVIDERS["gemini"]["models"]:
            try:
                print(f"Trying Gemini model: {model}")
                response = gemini_client.models.generate_content(
                    model=model,
                    contents=prompt
                )
                return response.text if response.text else "Sorry, I couldn't generate a response."
            except Exception as e:
                print(f"Gemini model {model} failed: {e}")
                continue

        return "Error: All Gemini models failed. Please check your API key."

    async def _generate_groq(self, prompt: str) -> str:
        """Generate using Groq (LLaMA)."""
        for model in self.PROVIDERS["groq"]["models"]:
            try:
                print(f"Trying Groq model: {model}")
                response = groq_client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are a helpful, friendly study tutor."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=2048
                )
                return response.choices[0].message.content or "Sorry, I couldn't generate a response."
            except Exception as e:
                print(f"Groq model {model} failed: {e}")
                continue

        return "Error: All Groq models failed. Please check your API key."

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

        answer = await self._generate(prompt)
        return answer, []

    def get_current_config(self) -> dict:
        """Get current provider configuration."""
        return {
            "provider": self.provider,
            "model": self.model,
            "available_providers": list(self.PROVIDERS.keys())
        }
