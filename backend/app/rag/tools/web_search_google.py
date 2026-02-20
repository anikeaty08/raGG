from typing import Dict, Any, Optional, List
import os
import time
from collections import OrderedDict
from googleapiclient.discovery import build
from app.config import get_settings
from .base import Tool, ToolResult, ToolType

settings = get_settings()


class WebSearchGoogleTool(Tool):
    """Google Custom Search API tool."""
    
    def __init__(self):
        super().__init__(
            name="web_search_google",
            description="Search the web using Google Custom Search API. Returns relevant web pages with titles, URLs, and snippets. Use as fallback when Tavily is unavailable.",
            tool_type=ToolType.SEARCH
        )
        self.api_key = settings.google_search_api_key
        self.search_engine_id = settings.google_search_engine_id
        self.service = None
        
        if self.api_key and self.search_engine_id:
            try:
                self.service = build("customsearch", "v1", developerKey=self.api_key)
            except Exception as e:
                print(f"Failed to initialize Google Search: {e}")
        
        self._cache: OrderedDict[str, tuple] = OrderedDict()
        self._cache_ttl = int(os.getenv("WEB_SEARCH_CACHE_TTL_SECONDS", "3600"))
        self._max_cache_size = 100
    
    def _get_cache_key(self, query: str, num_results: int = 5) -> str:
        """Generate cache key."""
        return f"google:{query.lower().strip()}:{num_results}"
    
    def _get_cached(self, cache_key: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached result if still valid."""
        if cache_key in self._cache:
            result, timestamp = self._cache[cache_key]
            if time.time() - timestamp < self._cache_ttl:
                self._cache.move_to_end(cache_key)
                return result
            else:
                del self._cache[cache_key]
        return None
    
    def _set_cache(self, cache_key: str, result: List[Dict[str, Any]]):
        """Cache a result."""
        if len(self._cache) >= self._max_cache_size:
            self._cache.popitem(last=False)
        self._cache[cache_key] = (result, time.time())
    
    async def execute(self, query: str, max_results: int = 5, **kwargs) -> ToolResult:
        """Execute Google web search."""
        if not self.service:
            return ToolResult(
                success=False,
                data=None,
                error="Google Search API not configured (missing API key or Engine ID)"
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
                metadata={"cached": True, "source": "google"}
            )
        
        try:
            # Google Custom Search API call
            result = self.service.cse().list(
                q=query,
                cx=self.search_engine_id,
                num=min(max_results, 10)  # Google limits to 10 per request
            ).execute()
            
            # Format results
            results = []
            for item in result.get("items", []):
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("link", ""),
                    "snippet": item.get("snippet", ""),
                    "score": 1.0,  # Google doesn't provide scores
                })
            
            # Cache the result
            self._set_cache(cache_key, results)
            
            return ToolResult(
                success=True,
                data=results,
                metadata={
                    "cached": False,
                    "source": "google",
                    "query": query,
                    "results_count": len(results)
                }
            )
        except Exception as e:
            return ToolResult(
                success=False,
                data=None,
                error=f"Google search error: {str(e)}"
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
