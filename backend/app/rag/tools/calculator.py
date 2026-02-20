from typing import Dict, Any
import math
import re
from .base import Tool, ToolResult, ToolType


class CalculatorTool(Tool):
    """Calculator tool for mathematical operations."""
    
    # Allowed operations and functions
    ALLOWED_NAMES = {
        k: v for k, v in math.__dict__.items() if not k.startswith("__")
    }
    ALLOWED_NAMES.update({
        "abs": abs,
        "round": round,
        "min": min,
        "max": max,
        "sum": sum,
        "pow": pow,
    })
    
    def __init__(self):
        super().__init__(
            name="calculator",
            description="Perform mathematical calculations. Supports basic arithmetic, trigonometry, logarithms, and more.",
            tool_type=ToolType.CALCULATION
        )
    
    async def execute(self, expression: str, **kwargs) -> ToolResult:
        """Execute calculation."""
        if not expression or not expression.strip():
            return ToolResult(
                success=False,
                data=None,
                error="Expression cannot be empty"
            )
        
        try:
            # Sanitize expression - only allow safe characters
            sanitized = re.sub(r'[^0-9+\-*/().\s,abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_]', '', expression)
            
            # Evaluate safely
            result = eval(sanitized, {"__builtins__": {}}, self.ALLOWED_NAMES)
            
            return ToolResult(
                success=True,
                data={
                    "expression": expression,
                    "result": result,
                    "formatted": f"{result:.10g}" if isinstance(result, float) else str(result)
                },
                metadata={"type": "calculation"}
            )
        except Exception as e:
            return ToolResult(
                success=False,
                data=None,
                error=f"Calculation error: {str(e)}"
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
                        "expression": {
                            "type": "string",
                            "description": "Mathematical expression to evaluate (e.g., '2 + 2', 'sqrt(16)', 'sin(pi/2)')"
                        }
                    },
                    "required": ["expression"]
                }
            }
        }
    
    def validate_params(self, **kwargs) -> bool:
        """Validate parameters."""
        if "expression" not in kwargs:
            return False
        expression = kwargs.get("expression", "")
        if not isinstance(expression, str) or not expression.strip():
            return False
        return True
