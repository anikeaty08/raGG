from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any, AsyncIterator
from dataclasses import dataclass


@dataclass
class LLMResponse:
    """Standardized LLM response."""
    content: str
    model: str
    provider: str
    tokens_used: Optional[int] = None
    cost: Optional[float] = None
    finish_reason: Optional[str] = None


@dataclass
class LLMMessage:
    """Standardized message format."""
    role: str  # "user", "assistant", "system"
    content: str


class LLMProvider(ABC):
    """Base class for LLM providers."""
    
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model
        self.provider_name = self.__class__.__name__.replace("Provider", "").lower()
    
    @abstractmethod
    async def generate(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> LLMResponse:
        """Generate a response from the LLM."""
        pass
    
    @abstractmethod
    async def generate_stream(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """Generate a streaming response."""
        pass
    
    @abstractmethod
    def supports_function_calling(self) -> bool:
        """Check if provider supports function calling."""
        pass
    
    @abstractmethod
    def get_available_models(self) -> List[str]:
        """Get list of available models for this provider."""
        pass
    
    def estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """Estimate cost for token usage. Override in subclasses."""
        return 0.0
    
    def format_messages(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None
    ) -> List[LLMMessage]:
        """Convert dict messages to LLMMessage format."""
        formatted = []
        if system_prompt:
            formatted.append(LLMMessage(role="system", content=system_prompt))
        for msg in messages:
            formatted.append(LLMMessage(role=msg["role"], content=msg["content"]))
        return formatted
