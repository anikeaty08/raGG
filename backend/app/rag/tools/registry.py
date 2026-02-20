from typing import Dict, List, Optional, Any
from .base import Tool


class ToolRegistry:
    """Registry for managing available tools."""
    
    def __init__(self):
        self._tools: Dict[str, Tool] = {}
    
    def register(self, tool: Tool):
        """Register a tool."""
        self._tools[tool.name] = tool
    
    def unregister(self, tool_name: str):
        """Unregister a tool."""
        if tool_name in self._tools:
            del self._tools[tool_name]
    
    def get(self, tool_name: str) -> Optional[Tool]:
        """Get a tool by name."""
        return self._tools.get(tool_name)
    
    def get_all(self) -> List[Tool]:
        """Get all registered tools."""
        return list(self._tools.values())
    
    def get_schemas(self) -> List[Dict[str, Any]]:
        """Get function calling schemas for all tools."""
        return [tool.get_schema() for tool in self._tools.values()]
    
    def get_by_type(self, tool_type) -> List[Tool]:
        """Get tools by type."""
        return [tool for tool in self._tools.values() if tool.tool_type == tool_type]
    
    def list_names(self) -> List[str]:
        """List all tool names."""
        return list(self._tools.keys())


# Global registry instance
tool_registry = ToolRegistry()
