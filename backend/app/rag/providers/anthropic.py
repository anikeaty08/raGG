from typing import Optional, List, AsyncIterator
import anthropic
from .base import LLMProvider, LLMResponse, LLMMessage


class AnthropicProvider(LLMProvider):
    """Anthropic Claude provider."""
    
    # Model pricing per 1M tokens (input/output)
    PRICING = {
        "claude-opus-4-20250514": {"input": 15.0, "output": 75.0},
        "claude-sonnet-4-20250514": {"input": 3.0, "output": 15.0},
        "claude-haiku-4-20250514": {"input": 0.8, "output": 4.0},
        "claude-3-5-sonnet-20241022": {"input": 3.0, "output": 15.0},
        "claude-3-5-haiku-20241022": {"input": 0.8, "output": 4.0},
    }
    
    AVAILABLE_MODELS = [
        "claude-opus-4-20250514",
        "claude-sonnet-4-20250514",
        "claude-haiku-4-20250514",
        "claude-3-5-sonnet-20241022",
        "claude-3-5-haiku-20241022",
    ]
    
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        super().__init__(api_key, model)
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
    
    async def generate(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> LLMResponse:
        """Generate a response using Anthropic Claude."""
        # Convert messages to Anthropic format
        system_msg = system_prompt
        anthropic_messages = []
        
        for msg in messages:
            if msg.role == "system":
                system_msg = msg.content
            else:
                anthropic_messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens or 4096,
                temperature=temperature,
                system=system_msg,
                messages=anthropic_messages,
                **kwargs
            )
            
            content = ""
            if response.content:
                for block in response.content:
                    if block.type == "text":
                        content += block.text
            
            # Estimate tokens (Anthropic doesn't always return usage)
            input_tokens = response.usage.input_tokens if hasattr(response, 'usage') else 0
            output_tokens = response.usage.output_tokens if hasattr(response, 'usage') else 0
            
            cost = self.estimate_cost(input_tokens, output_tokens)
            
            return LLMResponse(
                content=content,
                model=self.model,
                provider="anthropic",
                tokens_used=input_tokens + output_tokens,
                cost=cost,
                finish_reason=response.stop_reason
            )
        except Exception as e:
            raise Exception(f"Anthropic API error: {str(e)}")
    
    async def generate_stream(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """Generate a streaming response."""
        system_msg = system_prompt
        anthropic_messages = []
        
        for msg in messages:
            if msg.role == "system":
                system_msg = msg.content
            else:
                anthropic_messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        try:
            async with self.client.messages.stream(
                model=self.model,
                max_tokens=max_tokens or 4096,
                temperature=temperature,
                system=system_msg,
                messages=anthropic_messages,
                **kwargs
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except Exception as e:
            raise Exception(f"Anthropic streaming error: {str(e)}")
    
    def supports_function_calling(self) -> bool:
        """Anthropic supports function calling."""
        return True
    
    def get_available_models(self) -> List[str]:
        """Get available Anthropic models."""
        return self.AVAILABLE_MODELS
    
    def estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """Estimate cost based on model pricing."""
        if self.model not in self.PRICING:
            return 0.0
        
        pricing = self.PRICING[self.model]
        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]
        return input_cost + output_cost
