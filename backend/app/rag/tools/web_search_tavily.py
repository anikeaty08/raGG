from typing import Dict, Any, Optional, List
import os
import time
from collections import OrderedDict
from tavily import TavilyClient
from app.config import get_settings
from .base import Tool, ToolResult, ToolType

settings = get_settings()


class WebSearchTavilyTool(Tool):
    """Tavily web search tool."""
    
    def __init__(self):
        super().__init__(
            name="web_search",
            description="Search the web for current information using Tavily API. Returns relevant web pages with titles, URLs, and snippets.",
            tool_type=ToolType.SEARCH
        )
        self.api_key = settings.tavily_api_key
        self.client = TavilyClient(api_key=self.api_key) if self.api_key else None
        self._cache: OrderedDict[str, tuple] = OrderedDict()
        self._cache_ttl = int(os.getenv("WEB_SEARCH_CACHE_TTL_SECONDS", "3600"))
        self._max_cache_size = 100
    
    def _get_cache_key(self, query: str, max_results: int = 5) -> str:
        """Generate cache key."""
        return f"{query.lower().strip()}:{max_results}"
    
    def _get_cached(self, cache_key: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached result if still valid."""
        if cache_key in self._cache:
            result, timestamp = self._cache[cache_key]
            if time.time() - timestamp < self._cache_ttl:
                # Move to end (most recently used)
                self._cache.move_to_end(cache_key)
                return result
            else:
                del self._cache[cache_key]
        return None
    
    def _set_cache(self, cache_key: str, result: List[Dict[str, Any]]):
        """Cache a result."""
        # Remove oldest if cache is full
        if len(self._cache) >= self._max_cache_size:
            self._cache.popitem(last=False)
        
        self._cache[cache_key] = (result, time.time())
    
    async def execute(self, query: str, max_results: int = 5, **kwargs) -> ToolResult:
        """Execute web search."""
        if not self.client:
            return ToolResult(
                success=False,
                data=None,
                error="Tavily API key not configured"
            )
        
        if not query or not query.strip():
            return ToolResult(
                success=False,
                data=None,
                error="Query cannot be empty"
            )
        
        cache_key = self._get_cache_key(query, max_results)
        cached_result = self._get_cached(cache_key)
        
        if cached_result:
            return ToolResult(
                success=True,
                data=cached_result,
                metadata={"cached": True, "source": "tavily"}
            )
        
        try:
            # Perform search
            response = self.client.search(
                query=query,
                max_results=max_results,
                search_depth="basic",  # or "advanced" for deeper search
                **kwargs
            )
            
            # Format results
            results = []
            for result in response.get("results", []):
                results.append({
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "snippet": result.get("content", ""),
                    "score": result.get("score", 0.0),
                })
            
            # Cache the result
            self._set_cache(cache_key, results)
            
            return ToolResult(
                success=True,
                data=results,
                metadata={
                    "cached": False,
                    "source": "tavily",
                    "query": query,
                    "results_count": len(results)
                }
            )
        except Exception as e:
            return ToolResult(
                success=False,
                data=None,
                error=f"Tavily search error: {str(e)}"
            )
    
    def get_schema(self) -> Dict[str, Any]:
        """Get function calling schema."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The search query to find information on the web"
                        },
                        "max_results": {
                            "type": "integer",
                            "description": "Maximum number of results to return (default: 5, max: 10)",
                            "default": 5,
                            "minimum": 1,
                            "maximum": 10
                        }
                    },
                    "required": ["query"]
                }
            }
        }
    
    def validate_params(self, **kwargs) -> bool:
        """Validate parameters."""
        if "query" not in kwargs:
            return False
        query = kwargs.get("query", "")
        if not isinstance(query, str) or not query.strip():
            return False
        return True
