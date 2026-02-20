from typing import List, Dict, Any, Optional
from app.rag.providers.base import LLMMessage
from app.rag.providers.factory import ProviderFactory


class QueryPlanner:
    """Agentic query planning and decomposition."""
    
    def __init__(self):
        self.provider_factory = ProviderFactory()
    
    async def plan_query(
        self,
        query: str,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create an execution plan for a query."""
        
        # Simple heuristic-based planning (can be enhanced with LLM)
        plan = {
            "original_query": query,
            "steps": [],
            "requires_retrieval": True,
            "requires_tools": False,
            "estimated_complexity": "medium"
        }
        
        query_lower = query.lower()
        
        # Detect if web search is needed
        if any(keyword in query_lower for keyword in ["current", "recent", "latest", "today", "now", "2024", "2025"]):
            plan["requires_tools"] = True
            plan["steps"].append({
                "type": "web_search",
                "query": query,
                "reason": "Query requires current/recent information"
            })
        
        # Detect if calculation is needed
        if any(keyword in query_lower for keyword in ["calculate", "compute", "math", "equation", "+", "-", "*", "/"]):
            plan["requires_tools"] = True
            plan["steps"].append({
                "type": "calculator",
                "reason": "Query involves mathematical calculation"
            })
        
        # Detect multi-step queries
        if "?" in query and query.count("?") > 1:
            plan["estimated_complexity"] = "complex"
            plan["steps"].append({
                "type": "decompose",
                "reason": "Multiple questions detected"
            })
        
        # Always include retrieval step
        plan["steps"].insert(0, {
            "type": "retrieval",
            "query": query,
            "reason": "Retrieve relevant context from knowledge base"
        })
        
        plan["steps"].append({
            "type": "synthesis",
            "reason": "Combine retrieved information and tool results"
        })
        
        return plan
    
    async def decompose_query(
        self,
        query: str,
        provider: Optional[str] = None
    ) -> List[str]:
        """Decompose complex query into sub-queries."""
        
        # Simple decomposition (can be enhanced with LLM)
        sub_queries = []
        
        # Split by question marks
        parts = query.split("?")
        for part in parts:
            part = part.strip()
            if part and len(part) > 10:  # Minimum length
                # Add question mark if it's a question
                if not part.endswith("?"):
                    part += "?"
                sub_queries.append(part)
        
        # If no decomposition found, return original
        if len(sub_queries) <= 1:
            return [query]
        
        return sub_queries
    
    async def refine_plan_with_llm(
        self,
        query: str,
        initial_plan: Dict[str, Any],
        provider: Optional[str] = None
    ) -> Dict[str, Any]:
        """Use LLM to refine the execution plan."""
        
        # For now, return initial plan
        # Can be enhanced to use LLM for better planning
        return initial_plan
