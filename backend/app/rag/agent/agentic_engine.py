from typing import Optional, List, Dict, Any, AsyncIterator
from collections import defaultdict
import time
import uuid

from app.rag.vectorstore import VectorStore
from app.rag.providers.factory import ProviderFactory
from app.rag.providers.base import LLMProvider, LLMMessage
from app.rag.router.model_router import ModelRouter
from app.rag.agent.planner import QueryPlanner
from app.rag.agent.tool_executor import ToolExecutor
from app.rag.agent.function_calling import FunctionCallingHandler
from app.rag.agent.verifier import AnswerVerifier
from app.rag.agent.reflection import SelfReflection
from app.rag.retrieval.multi_hop import MultiHopRetrieval
from app.rag.tools.registry import tool_registry
from app.analytics.metrics import metrics_collector, QueryMetrics


class AgenticRAGEngine:
    """Agentic RAG Engine with multi-model support, tools, and verification."""
    
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store
        self.conversations: dict[str, list] = defaultdict(list)
        self.provider_factory = ProviderFactory()
        self.model_router = ModelRouter()
        self.query_planner = QueryPlanner()
        self.tool_executor = ToolExecutor()
        self.multi_hop_retrieval = MultiHopRetrieval(vector_store)
        
        # Initialize tools
        self._initialize_tools()
        
        # Current provider - initialize with first available provider
        default_provider = self.provider_factory.get_default_provider()
        if default_provider:
            self.current_provider = default_provider
            # Get provider name from factory
            available = self.provider_factory.get_available_providers()
            if available:
                self.current_provider_name = available[0]
                self.current_model = default_provider.model
            else:
                self.current_provider_name = "unknown"
                self.current_model = "unknown"
        else:
            self.current_provider = None
            self.current_provider_name = "none"
            self.current_model = "none"
            print("Warning: No LLM providers available. Please set at least one API key.")
    
    def _initialize_tools(self):
        """Register all available tools."""
        from app.rag.tools.web_search_tavily import WebSearchTavilyTool
        from app.rag.tools.web_search_google import WebSearchGoogleTool
        from app.rag.tools.calculator import CalculatorTool
        from app.rag.tools.code_executor import CodeExecutorTool
        
        # Register web search tools (optional - only if API keys provided)
        try:
            tavily_tool = WebSearchTavilyTool()
            if tavily_tool.api_key and tavily_tool.client:
                tool_registry.register(tavily_tool)
                print(f"✓ Registered Tavily web search tool")
            else:
                print("⚠ Tavily web search not available (missing TAVILY_API_KEY)")
        except Exception as e:
            print(f"⚠ Failed to initialize Tavily tool: {e}")
        
        try:
            google_tool = WebSearchGoogleTool()
            if google_tool.service:
                tool_registry.register(google_tool)
                print(f"✓ Registered Google web search tool")
            else:
                print("⚠ Google web search not available (missing GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_ENGINE_ID)")
        except Exception as e:
            print(f"⚠ Failed to initialize Google Search tool: {e}")
        
        # Register other tools (always available)
        try:
            tool_registry.register(CalculatorTool())
            print("✓ Registered calculator tool")
        except Exception as e:
            print(f"⚠ Failed to register calculator: {e}")
        
        try:
            tool_registry.register(CodeExecutorTool())
            print("✓ Registered code executor tool")
        except Exception as e:
            print(f"⚠ Failed to register code executor: {e}")
        
        print(f"Total tools registered: {len(tool_registry.get_all())}")
    
    def set_provider(self, provider_name: str, model: Optional[str] = None):
        """Switch LLM provider."""
        provider = self.provider_factory.create_provider(provider_name, model)
        if provider:
            self.current_provider = provider
            self.current_provider_name = provider_name
            self.current_model = provider.model
            print(f"Switched to provider: {provider_name}, model: {provider.model}")
        else:
            raise ValueError(f"Provider '{provider_name}' not available or invalid model")
    
    def get_current_config(self) -> Dict[str, Any]:
        """Get current provider configuration."""
        if self.current_provider:
            return {
                "provider": self.current_provider_name,
                "model": self.current_model,
                "available_providers": self.provider_factory.get_available_providers()
            }
        return {
            "provider": "none",
            "model": "none",
            "available_providers": []
        }
    
    def clear_conversation(self, session_id: str):
        """Clear conversation history for a session."""
        if session_id in self.conversations:
            del self.conversations[session_id]
    
    def _trim_conversation_history(self, session_id: str, max_messages: int = 20):
        """Trim conversation history to prevent token overflow."""
        if session_id in self.conversations:
            messages = self.conversations[session_id]
            if len(messages) > max_messages:
                # Keep system message if exists, then last N messages
                system_msgs = [m for m in messages if m.get("role") == "system"]
                other_messages = [m for m in messages if m.get("role") != "system"]
                keep_messages = other_messages[-max_messages:]
                self.conversations[session_id] = system_msgs + keep_messages
    
    async def query(
        self,
        question: str,
        session_id: str,
        top_k: int = 5,
        source_filter: Optional[str] = None,
        user_id: str = "default",
        use_agentic: bool = True,
        use_web_search: bool = False
    ) -> tuple[str, List[Dict[str, Any]], Dict[str, Any]]:
        """Process a query with agentic capabilities."""
        
        start_time = time.time()
        query_id = str(uuid.uuid4())
        
        try:
            # Add user message to conversation history
            self.conversations[session_id].append({"role": "user", "content": question})
            
            # Route to appropriate provider
            if not self.current_provider:
                self.current_provider = self.model_router.route_query(question)
            
            if not self.current_provider:
                raise Exception("No LLM provider available")
            
            # Create function calling handler
            function_handler = FunctionCallingHandler(self.current_provider)
            
            # Plan query if agentic mode
            plan = None
            if use_agentic:
                plan = await self.query_planner.plan_query(question)
            
            # Check if web search is needed
            web_search_results = []
            if use_web_search:
                # Check for web search tool
                web_search_tool = tool_registry.get("web_search")
                if not web_search_tool:
                    web_search_tool = tool_registry.get("web_search_google")
                
                if web_search_tool:
                    # Perform web search when explicitly requested
                    search_result = await web_search_tool.execute(query=question, max_results=5)
                    if search_result.success:
                        web_search_results = search_result.data
                else:
                    print("Warning: Web search requested but no web search tool available (missing API keys)")
            elif plan and plan.get("requires_tools"):
                # Auto-detect if web search might be helpful
                query_lower = question.lower()
                needs_search = any(kw in query_lower for kw in ["current", "recent", "latest", "today", "now", "2024", "2025"])
                
                if needs_search:
                    web_search_tool = tool_registry.get("web_search")
                    if not web_search_tool:
                        web_search_tool = tool_registry.get("web_search_google")
                    
                    if web_search_tool:
                        search_result = await web_search_tool.execute(query=question, max_results=5)
                        if search_result.success:
                            web_search_results = search_result.data
            
            # Retrieve relevant chunks
            if use_agentic:
                results = await self.multi_hop_retrieval.retrieve(
                    query=question,
                    top_k=top_k,
                    source_filter=source_filter,
                    user_id=user_id
                )
            else:
                results = await self.vector_store.search(
                    query=question,
                    top_k=top_k,
                    source_filter=source_filter,
                    user_id=user_id
                )
            
            # Build context
            context_parts = []
            citations = []
            
            if results:
                for i, result in enumerate(results):
                    metadata = result.get("metadata", {})
                    source_info = self._format_source_info(metadata)
                    context_parts.append(f"[Source {i + 1}: {source_info}]\n{result.get('content', '')}")
                    
                    citation = {
                        "source": str(metadata.get("file_path") or metadata.get("source_name") or "Unknown"),
                        "content": str(result.get("content", ""))[:200],
                    }
                    if metadata.get("line_start"):
                        try:
                            citation["line"] = int(metadata.get("line_start"))
                        except:
                            pass
                    if metadata.get("page"):
                        try:
                            citation["page"] = int(metadata.get("page"))
                        except:
                            pass
                    citations.append(citation)
            
            # Add web search results to context
            if web_search_results:
                web_context = "\n\nWeb Search Results:\n"
                for i, result in enumerate(web_search_results):
                    web_context += f"[Web Result {i+1}: {result.get('title', '')}]\n{result.get('snippet', '')}\nURL: {result.get('url', '')}\n\n"
                    citations.append({
                        "source": result.get("url", ""),
                        "content": result.get("snippet", "")[:200],
                        "type": "web"
                    })
                context_parts.insert(0, web_context)
            
            context = "\n\n---\n\n".join(context_parts)
            
            # Build system prompt
            system_prompt = """You are a friendly and knowledgeable study tutor helping a student learn.

Your job:
- Answer the question naturally and conversationally, like a helpful teacher would
- Use the context provided to inform your answer
- Explain concepts clearly with examples when helpful
- Don't be robotic - be warm and engaging
- Keep citations minimal - only add [Source N] at the end if directly quoting or for specific facts
- If the context doesn't have enough info, use your knowledge to help but mention what came from the sources
- Remember previous conversation context to provide coherent follow-up answers"""
            
            # Build messages with conversation history
            messages = []
            for msg in self.conversations[session_id][:-1]:  # Exclude current user message
                messages.append(LLMMessage(role=msg["role"], content=msg["content"]))
            
            # Add current question with context
            if context:
                user_content = f"""Context from uploaded materials and web search:
{context}

Student's question: {question}

Give a helpful, natural response:"""
            else:
                user_content = f"""Student's question: {question}

Give a helpful, natural response:"""
            
            messages.append(LLMMessage(role="user", content=user_content))
            
            # Generate response
            response = await self.current_provider.generate(
                messages=messages,
                system_prompt=system_prompt,
                temperature=0.7
            )
            
            # Ensure answer is a string
            answer = response.content
            if not isinstance(answer, str):
                if isinstance(answer, tuple):
                    answer = str(answer[0]) if len(answer) > 0 else ""
                else:
                    answer = str(answer)
            
            # Verify answer if agentic mode
            verification = None
            if use_agentic and results:
                verifier = AnswerVerifier(self.current_provider)
                verification = await verifier.verify(answer, results, question)
            
            # Add assistant response to history
            self.conversations[session_id].append({"role": "assistant", "content": answer})
            self._trim_conversation_history(session_id)
            
            # Record metrics
            duration_ms = (time.time() - start_time) * 1000
            metrics = QueryMetrics(
                query_id=query_id,
                provider=self.current_provider_name,
                model=self.current_model,
                tokens_used=response.tokens_used or 0,
                cost=response.cost or 0.0,
                duration_ms=duration_ms,
                success=True
            )
            metrics_collector.record_query(metrics)
            
            # Build metadata
            metadata = {
                "plan": plan,
                "verification": verification,
                "web_search_used": len(web_search_results) > 0,
                "tools_used": self.tool_executor.get_execution_history()
            }
            
            return answer, citations, metadata
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            metrics = QueryMetrics(
                query_id=query_id,
                provider=self.current_provider_name,
                model=self.current_model,
                tokens_used=0,
                cost=0.0,
                duration_ms=duration_ms,
                success=False,
                error=str(e)
            )
            metrics_collector.record_query(metrics)
            raise
    
    async def query_stream(
        self,
        question: str,
        session_id: str,
        top_k: int = 5,
        source_filter: Optional[str] = None,
        user_id: str = "default",
        use_agentic: bool = True,
        use_web_search: bool = False
    ) -> AsyncIterator[Dict[str, Any]]:
        """Stream query responses."""
        
        try:
            # Add user message
            self.conversations[session_id].append({"role": "user", "content": question})
            
            # Route provider
            if not self.current_provider:
                self.current_provider = self.model_router.route_query(question)
            
            if not self.current_provider:
                yield {"error": "No LLM provider available"}
                return
            
            # Web search if needed
            web_search_results = []
            if use_web_search:
                web_search_tool = tool_registry.get("web_search") or tool_registry.get("web_search_google")
                if web_search_tool:
                    # Perform web search when explicitly requested
                    search_result = await web_search_tool.execute(query=question, max_results=5)
                    if search_result.success:
                        web_search_results = search_result.data
                        yield {"type": "web_search", "results": web_search_results, "session_id": session_id}
                else:
                    yield {"type": "error", "error": "Web search requested but no web search tool available (missing API keys)"}
            
            # Retrieve chunks
            if use_agentic:
                results = await self.multi_hop_retrieval.retrieve(
                    query=question,
                    top_k=top_k,
                    source_filter=source_filter,
                    user_id=user_id
                )
            else:
                results = await self.vector_store.search(
                    query=question,
                    top_k=top_k,
                    source_filter=source_filter,
                    user_id=user_id
                )
            
            # Build context
            context_parts = []
            citations = []
            
            if results:
                for i, result in enumerate(results):
                    metadata = result.get("metadata", {})
                    source_info = self._format_source_info(metadata)
                    context_parts.append(f"[Source {i + 1}: {source_info}]\n{result.get('content', '')}")
                    
                    citation = {
                        "source": str(metadata.get("file_path") or metadata.get("source_name") or "Unknown"),
                        "content": str(result.get("content", ""))[:200],
                    }
                    if metadata.get("line_start"):
                        try:
                            citation["line"] = int(metadata.get("line_start"))
                        except:
                            pass
                    citations.append(citation)
            
            if web_search_results:
                web_context = "\n\nWeb Search Results:\n"
                for i, result in enumerate(web_search_results):
                    web_context += f"[Web Result {i+1}: {result.get('title', '')}]\n{result.get('snippet', '')}\n"
                    citations.append({
                        "source": result.get("url", ""),
                        "content": result.get("snippet", "")[:200],
                        "type": "web"
                    })
                context_parts.insert(0, web_context)
            
            context = "\n\n---\n\n".join(context_parts)
            
            # Build messages
            messages = []
            for msg in self.conversations[session_id][:-1]:
                messages.append(LLMMessage(role=msg["role"], content=msg["content"]))
            
            system_prompt = """You are a friendly and knowledgeable study tutor helping a student learn."""
            
            if context:
                user_content = f"""Context:
{context}

Question: {question}

Answer:"""
            else:
                user_content = f"Question: {question}\n\nAnswer:"
            
            messages.append(LLMMessage(role="user", content=user_content))
            
            # Stream response
            full_answer = ""
            async for chunk in self.current_provider.generate_stream(
                messages=messages,
                system_prompt=system_prompt,
                temperature=0.7
            ):
                full_answer += chunk
                yield {"type": "chunk", "content": chunk, "session_id": session_id}
            
            # Add to history
            self.conversations[session_id].append({"role": "assistant", "content": full_answer})
            self._trim_conversation_history(session_id)
            
            # Send citations
            yield {"type": "done", "citations": citations, "session_id": session_id}
            
        except Exception as e:
            yield {"type": "error", "error": str(e)}
    
    def _format_source_info(self, metadata: Dict[str, Any]) -> str:
        """Format source information for display."""
        parts = []
        if metadata.get("source_name"):
            parts.append(metadata["source_name"])
        if metadata.get("file_path"):
            parts.append(metadata["file_path"])
        if metadata.get("page"):
            parts.append(f"page {metadata['page']}")
        if metadata.get("line_start"):
            parts.append(f"line {metadata['line_start']}")
        return " | ".join(parts) if parts else "Unknown"
