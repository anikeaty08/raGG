from typing import Dict, Any, List, Optional
import json
import time
from app.rag.tools.registry import tool_registry
from app.rag.tools.base import ToolResult


class ToolExecutor:
    """Executes tools based on function calls from LLM."""
    
    def __init__(self):
        self.execution_history: List[Dict[str, Any]] = []
    
    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> ToolResult:
        """Execute a single tool."""
        tool = tool_registry.get(tool_name)
        
        if not tool:
            return ToolResult(
                success=False,
                data=None,
                error=f"Tool '{tool_name}' not found"
            )
        
        # Validate parameters
        if not tool.validate_params(**arguments):
            return ToolResult(
                success=False,
                data=None,
                error=f"Invalid parameters for tool '{tool_name}'"
            )
        
        try:
            # Execute tool
            result = await tool.execute(**arguments)
            
            # Record execution
            self.execution_history.append({
                "tool": tool_name,
                "arguments": arguments,
                "success": result.success,
                "timestamp": str(time.time())
            })
            
            return result
        except Exception as e:
            return ToolResult(
                success=False,
                data=None,
                error=f"Tool execution error: {str(e)}"
            )
    
    async def execute_function_calls(
        self,
        function_calls: List[Dict[str, Any]]
    ) -> List[ToolResult]:
        """Execute multiple function calls."""
        results = []
        
        for call in function_calls:
            tool_name = call.get("name")
            arguments = call.get("arguments", {})
            
            # Parse arguments if string
            if isinstance(arguments, str):
                try:
                    arguments = json.loads(arguments)
                except:
                    arguments = {}
            
            result = await self.execute_tool(tool_name, arguments)
            results.append(result)
        
        return results
    
    def format_tool_results_for_llm(self, results: List[ToolResult]) -> str:
        """Format tool results for LLM context."""
        formatted = []
        
        for i, result in enumerate(results):
            if result.success:
                formatted.append(f"Tool {i+1} Result:\n{json.dumps(result.data, indent=2)}")
            else:
                formatted.append(f"Tool {i+1} Error: {result.error}")
        
        return "\n\n".join(formatted)
    
    def get_execution_history(self) -> List[Dict[str, Any]]:
        """Get execution history."""
        return self.execution_history.copy()
    
    def clear_history(self):
        """Clear execution history."""
        self.execution_history = []
