from typing import List, Dict, Any, Optional
import json
from app.rag.providers.base import LLMProvider, LLMMessage
from app.rag.tools.registry import tool_registry


class FunctionCallingHandler:
    """Handles function calling for LLM providers."""
    
    def __init__(self, provider: LLMProvider):
        self.provider = provider
    
    def prepare_function_calling_messages(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> tuple[List[LLMMessage], Optional[List[Dict[str, Any]]]]:
        """Prepare messages and tools for function calling."""
        
        if not self.provider.supports_function_calling():
            return messages, None
        
        # Get tool schemas if not provided
        if tools is None:
            tools = tool_registry.get_schemas()
        
        return messages, tools
    
    def extract_function_calls(
        self,
        response: Any
    ) -> List[Dict[str, Any]]:
        """Extract function calls from LLM response."""
        
        function_calls = []
        
        # This is provider-specific and should be implemented per provider
        # For now, return empty list
        # Each provider implementation should handle this
        
        return function_calls
    
    def format_function_results(
        self,
        function_calls: List[Dict[str, Any]],
        results: List[Any]
    ) -> List[LLMMessage]:
        """Format function call results for LLM."""
        
        formatted_messages = []
        
        for call, result in zip(function_calls, results):
            tool_name = call.get("name", "unknown")
            call_id = call.get("id", "")
            
            # Format result
            if isinstance(result, dict) and "success" in result:
                if result["success"]:
                    content = json.dumps(result.get("data", {}), indent=2)
                else:
                    content = f"Error: {result.get('error', 'Unknown error')}"
            else:
                content = json.dumps(result, indent=2) if result else "No result"
            
            formatted_messages.append(LLMMessage(
                role="function",
                content=content
            ))
        
        return formatted_messages
