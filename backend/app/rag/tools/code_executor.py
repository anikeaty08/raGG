from typing import Dict, Any, Optional
import subprocess
import tempfile
import os
import sys
from .base import Tool, ToolResult, ToolType


class CodeExecutorTool(Tool):
    """Sandboxed code execution tool."""
    
    ALLOWED_LANGUAGES = ["python", "javascript", "bash"]
    MAX_EXECUTION_TIME = 10  # seconds
    MAX_OUTPUT_SIZE = 10000  # characters
    
    def __init__(self):
        super().__init__(
            name="execute_code",
            description="Execute code in a sandboxed environment. Supports Python, JavaScript, and Bash. Use with caution.",
            tool_type=ToolType.CODE
        )
    
    async def execute(
        self,
        code: str,
        language: str = "python",
        **kwargs
    ) -> ToolResult:
        """Execute code in sandboxed environment."""
        
        # Disable code execution in production for security
        if os.getenv("ENVIRONMENT") == "production":
            return ToolResult(
                success=False,
                data=None,
                error="Code execution is disabled in production"
            )
        
        if not code or not code.strip():
            return ToolResult(
                success=False,
                data=None,
                error="Code cannot be empty"
            )
        
        if language not in self.ALLOWED_LANGUAGES:
            return ToolResult(
                success=False,
                data=None,
                error=f"Language '{language}' not supported. Allowed: {', '.join(self.ALLOWED_LANGUAGES)}"
            )
        
        try:
            if language == "python":
                return await self._execute_python(code)
            elif language == "javascript":
                return await self._execute_javascript(code)
            elif language == "bash":
                return await self._execute_bash(code)
            else:
                return ToolResult(
                    success=False,
                    data=None,
                    error=f"Execution not implemented for {language}"
                )
        except Exception as e:
            return ToolResult(
                success=False,
                data=None,
                error=f"Execution error: {str(e)}"
            )
    
    async def _execute_python(self, code: str) -> ToolResult:
        """Execute Python code."""
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                temp_file = f.name
            
            try:
                # Execute with timeout
                result = subprocess.run(
                    [sys.executable, temp_file],
                    capture_output=True,
                    text=True,
                    timeout=self.MAX_EXECUTION_TIME,
                    cwd=tempfile.gettempdir()
                )
                
                output = result.stdout[:self.MAX_OUTPUT_SIZE]
                error = result.stderr[:self.MAX_OUTPUT_SIZE] if result.stderr else None
                
                return ToolResult(
                    success=result.returncode == 0,
                    data={
                        "output": output,
                        "error": error,
                        "return_code": result.returncode
                    },
                    metadata={"language": "python"}
                )
            finally:
                # Clean up
                if os.path.exists(temp_file):
                    os.unlink(temp_file)
        except subprocess.TimeoutExpired:
            return ToolResult(
                success=False,
                data=None,
                error=f"Code execution timed out after {self.MAX_EXECUTION_TIME} seconds"
            )
        except Exception as e:
            return ToolResult(
                success=False,
                data=None,
                error=f"Python execution error: {str(e)}"
            )
    
    async def _execute_javascript(self, code: str) -> ToolResult:
        """Execute JavaScript code using Node.js."""
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
                f.write(code)
                temp_file = f.name
            
            try:
                result = subprocess.run(
                    ["node", temp_file],
                    capture_output=True,
                    text=True,
                    timeout=self.MAX_EXECUTION_TIME,
                    cwd=tempfile.gettempdir()
                )
                
                output = result.stdout[:self.MAX_OUTPUT_SIZE]
                error = result.stderr[:self.MAX_OUTPUT_SIZE] if result.stderr else None
                
                return ToolResult(
                    success=result.returncode == 0,
                    data={
                        "output": output,
                        "error": error,
                        "return_code": result.returncode
                    },
                    metadata={"language": "javascript"}
                )
            finally:
                if os.path.exists(temp_file):
                    os.unlink(temp_file)
        except FileNotFoundError:
            return ToolResult(
                success=False,
                data=None,
                error="Node.js not found. Please install Node.js to execute JavaScript."
            )
        except subprocess.TimeoutExpired:
            return ToolResult(
                success=False,
                data=None,
                error=f"Code execution timed out after {self.MAX_EXECUTION_TIME} seconds"
            )
        except Exception as e:
            return ToolResult(
                success=False,
                data=None,
                error=f"JavaScript execution error: {str(e)}"
            )
    
    async def _execute_bash(self, code: str) -> ToolResult:
        """Execute Bash code."""
        try:
            result = subprocess.run(
                code,
                shell=True,
                capture_output=True,
                text=True,
                timeout=self.MAX_EXECUTION_TIME,
                cwd=tempfile.gettempdir()
            )
            
            output = result.stdout[:self.MAX_OUTPUT_SIZE]
            error = result.stderr[:self.MAX_OUTPUT_SIZE] if result.stderr else None
            
            return ToolResult(
                success=result.returncode == 0,
                data={
                    "output": output,
                    "error": error,
                    "return_code": result.returncode
                },
                metadata={"language": "bash"}
            )
        except subprocess.TimeoutExpired:
            return ToolResult(
                success=False,
                data=None,
                error=f"Code execution timed out after {self.MAX_EXECUTION_TIME} seconds"
            )
        except Exception as e:
            return ToolResult(
                success=False,
                data=None,
                error=f"Bash execution error: {str(e)}"
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
                        "code": {
                            "type": "string",
                            "description": "The code to execute"
                        },
                        "language": {
                            "type": "string",
                            "description": f"Programming language (one of: {', '.join(self.ALLOWED_LANGUAGES)})",
                            "enum": self.ALLOWED_LANGUAGES,
                            "default": "python"
                        }
                    },
                    "required": ["code"]
                }
            }
        }
    
    def validate_params(self, **kwargs) -> bool:
        """Validate parameters."""
        if "code" not in kwargs:
            return False
        code = kwargs.get("code", "")
        if not isinstance(code, str) or not code.strip():
            return False
        language = kwargs.get("language", "python")
        if language not in self.ALLOWED_LANGUAGES:
            return False
        return True
