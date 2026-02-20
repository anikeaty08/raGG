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
            # Add user message to conversation history
            self.conversations[session_id].append({"role": "user", "content": question})

            # Retrieve relevant chunks (filtered by user_id)
            results = await self.vector_store.search(
                query=question,
                top_k=top_k,
                source_filter=source_filter,
                user_id=user_id
            )

            # If no sources, use general chat mode
            if not results:
                answer = await self._general_chat(question, session_id)
                # Add assistant response to history
                self.conversations[session_id].append({"role": "assistant", "content": answer})
                return answer, []

            # Build context
            context_parts = []
            for i, result in enumerate(results):
                metadata = result.get("metadata", {})
                source_info = self._format_source_info(metadata)
                context_parts.append(f"[Source {i + 1}: {source_info}]\n{result.get('content', '')}")

            context = "\n\n---\n\n".join(context_parts)

            # Build system prompt
            system_prompt = """You are a friendly and knowledgeable study tutor helping a student learn.

Your job:
- Answer the question naturally and conversationally, like a helpful teacher would
- Use the context provided to inform your answer
- Explain concepts clearly with examples when helpful
- If the question has a typo (like "cllass" instead of "class"), understand what they meant and answer accordingly
- Don't be robotic - be warm and engaging
- Keep citations minimal - only add [Source N] at the end if directly quoting or for specific facts
- If the context doesn't have enough info, use your knowledge to help but mention what came from the sources
- Remember previous conversation context to provide coherent follow-up answers"""

            # Build prompt with context
            prompt = f"""{system_prompt}

Context from uploaded materials:
{context}

Student's question: {question}

Give a helpful, natural response:"""

            # Generate response with conversation history
            answer = await self._generate(prompt, session_id)

            # Add assistant response to history
            self.conversations[session_id].append({"role": "assistant", "content": answer})

            # Trim conversation history if too long (keep last 20 messages or ~4000 tokens)
            self._trim_conversation_history(session_id)

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

    def _trim_conversation_history(self, session_id: str, max_messages: int = 20):
        """Trim conversation history to prevent token overflow."""
        if session_id in self.conversations:
            history = self.conversations[session_id]
            if len(history) > max_messages:
                # Keep system message (if any) and last max_messages-1 messages
                # For now, just keep the last max_messages
                self.conversations[session_id] = history[-max_messages:]

    async def _generate(self, prompt: str, session_id: str) -> str:
        """Generate response using the current provider with conversation history."""

        if self.provider == "groq":
            return await self._generate_groq(prompt, session_id)
        else:
            return await self._generate_gemini(prompt, session_id)

    async def _generate_gemini(self, prompt: str, session_id: str) -> str:
        """Generate using Gemini with conversation history."""
        # Get conversation history for this session
        history = self.conversations.get(session_id, [])
        
        # Build messages list for Gemini
        # Gemini expects a list of content parts or a single string
        # For chat history, we'll use the chat API format
        messages = []
        
        # Add conversation history (excluding the current user message which is already in prompt)
        for msg in history[:-1]:  # Exclude last message as it's the current question
            if msg["role"] == "user":
                messages.append({"role": "user", "parts": [msg["content"]]})
            elif msg["role"] == "assistant":
                messages.append({"role": "model", "parts": [msg["content"]]})
        
        # Add current prompt as user message
        messages.append({"role": "user", "parts": [prompt]})
        
        for model in self.PROVIDERS["gemini"]["models"]:
            try:
                print(f"Trying Gemini model: {model}")
                # Use generate_content with history if available, otherwise use simple prompt
                if len(messages) > 1:
                    # Use chat format with history
                    response = gemini_client.models.generate_content(
                        model=model,
                        contents=messages
                    )
                else:
                    # Fallback to simple prompt
                    response = gemini_client.models.generate_content(
                        model=model,
                        contents=prompt
                    )
                return response.text if response.text else "Sorry, I couldn't generate a response."
            except Exception as e:
                print(f"Gemini model {model} failed: {e}")
                # Try fallback without history if history fails
                if len(messages) > 1:
                    try:
                        response = gemini_client.models.generate_content(
                            model=model,
                            contents=prompt
                        )
                        return response.text if response.text else "Sorry, I couldn't generate a response."
                    except:
                        pass
                continue

        return "Error: All Gemini models failed. Please check your API key."

    async def _generate_groq(self, prompt: str, session_id: str) -> str:
        """Generate using Groq (LLaMA) with conversation history."""
        # Get conversation history for this session
        history = self.conversations.get(session_id, [])
        
        # Build messages list starting with system message
        messages = [{"role": "system", "content": "You are a helpful, friendly study tutor."}]
        
        # Add conversation history (excluding the current user message which is already in prompt)
        for msg in history[:-1]:  # Exclude last message as it's the current question
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Add current prompt as user message
        messages.append({"role": "user", "content": prompt})
        
        for model in self.PROVIDERS["groq"]["models"]:
            try:
                print(f"Trying Groq model: {model}")
                response = groq_client.chat.completions.create(
                    model=model,
                    messages=messages,
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

    async def _general_chat(self, question: str, session_id: str) -> tuple[str, list[dict]]:
        """Handle general chat when no sources are available."""
        prompt = f"""You are a friendly and knowledgeable study tutor. Answer the student's question naturally and helpfully.

- Be conversational and warm, like a helpful teacher
- Explain concepts clearly with examples
- If they ask about something that would benefit from their own materials, gently suggest they can upload PDFs, GitHub repos, or URLs for personalized answers
- Keep responses focused and easy to understand
- Remember previous conversation context to provide coherent follow-up answers

Student's question: {question}

Your helpful response:"""

        answer = await self._generate(prompt, session_id)
        return answer, []

    def clear_conversation(self, session_id: str):
        """Clear conversation history for a session."""
        if session_id in self.conversations:
            self.conversations[session_id] = []

    def get_current_config(self) -> dict:
        """Get current provider configuration."""
        return {
            "provider": self.provider,
            "model": self.model,
            "available_providers": list(self.PROVIDERS.keys())
        }
