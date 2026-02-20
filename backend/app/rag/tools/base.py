from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from enum import Enum


class ToolType(Enum):
    """Tool type categories."""
    SEARCH = "search"
    CODE = "code"
    CALCULATION = "calculation"
    FILE = "file"
    API = "api"
    OTHER = "other"


@dataclass
class ToolResult:
    """Standardized tool result."""
    success: bool
    data: Any
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class Tool(ABC):
    """Base class for all tools."""
    
    def __init__(self, name: str, description: str, tool_type: ToolType = ToolType.OTHER):
        self.name = name
        self.description = description
        self.tool_type = tool_type
    
    @abstractmethod
    async def execute(self, **kwargs) -> ToolResult:
        """Execute the tool with given parameters."""
        pass
    
    @abstractmethod
    def get_schema(self) -> Dict[str, Any]:
        """Get function calling schema for this tool."""
        pass
    
    def validate_params(self, **kwargs) -> bool:
        """Validate input parameters. Override in subclasses."""
        return True
    
    def __repr__(self) -> str:
        return f"<Tool: {self.name}>"
