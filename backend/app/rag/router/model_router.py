from typing import Optional, Dict, Any
from app.rag.providers.factory import ProviderFactory
from app.rag.providers.base import LLMProvider


class ModelRouter:
    """Smart model routing based on query characteristics."""
    
    # Complexity thresholds
    SIMPLE_QUERY_MAX_LENGTH = 100
    COMPLEX_QUERY_MIN_LENGTH = 200
    
    def __init__(self):
        self.provider_factory = ProviderFactory()
    
    def route_query(
        self,
        query: str,
        preferred_provider: Optional[str] = None,
        preferred_model: Optional[str] = None,
        complexity: Optional[str] = None
    ) -> Optional[LLMProvider]:
        """Route query to appropriate model."""
        
        # Use preferred provider if specified
        if preferred_provider:
            provider = self.provider_factory.create_provider(preferred_provider, preferred_model)
            if provider:
                return provider
        
        # Auto-detect complexity if not specified
        if not complexity:
            complexity = self._detect_complexity(query)
        
        # Route based on complexity and availability
        if complexity == "simple":
            # Use fast, cost-effective models
            for provider_name in ["groq", "gemini", "openai"]:
                provider = self.provider_factory.create_provider(provider_name)
                if provider:
                    return provider
        
        elif complexity == "complex":
            # Use more capable models
            for provider_name in ["anthropic", "openai", "gemini"]:
                provider = self.provider_factory.create_provider(provider_name)
                if provider:
                    return provider
        
        # Default: use any available provider
        return self.provider_factory.get_default_provider()
    
    def _detect_complexity(self, query: str) -> str:
        """Detect query complexity."""
        query_lower = query.lower()
        
        # Simple indicators
        simple_keywords = ["what is", "who is", "when", "where", "yes", "no"]
        if any(keyword in query_lower for keyword in simple_keywords) and len(query) < self.SIMPLE_QUERY_MAX_LENGTH:
            return "simple"
        
        # Complex indicators
        complex_keywords = ["explain", "analyze", "compare", "why", "how", "describe"]
        if any(keyword in query_lower for keyword in complex_keywords) or len(query) > self.COMPLEX_QUERY_MIN_LENGTH:
            return "complex"
        
        # Multi-step queries
        if query.count("?") > 1 or query.count("and") > 2:
            return "complex"
        
        return "medium"
    
    def get_recommended_model(
        self,
        provider: str,
        complexity: str = "medium"
    ) -> Optional[str]:
        """Get recommended model for provider and complexity."""
        provider_instance = self.provider_factory.create_provider(provider)
        if not provider_instance:
            return None
        
        available_models = provider_instance.get_available_models()
        
        if provider == "anthropic":
            if complexity == "complex":
                return "claude-opus-4-20250514" if "claude-opus-4-20250514" in available_models else available_models[0]
            elif complexity == "simple":
                return "claude-haiku-4-20250514" if "claude-haiku-4-20250514" in available_models else available_models[-1]
            else:
                return "claude-sonnet-4-20250514" if "claude-sonnet-4-20250514" in available_models else available_models[0]
        
        elif provider == "openai":
            if complexity == "complex":
                return "gpt-4o" if "gpt-4o" in available_models else available_models[0]
            elif complexity == "simple":
                return "gpt-4o-mini" if "gpt-4o-mini" in available_models else available_models[-1]
            else:
                return "gpt-4o-mini" if "gpt-4o-mini" in available_models else available_models[0]
        
        elif provider == "gemini":
            return available_models[0]  # Default to first available
        
        elif provider == "groq":
            if complexity == "complex":
                return "llama-3.3-70b-versatile" if "llama-3.3-70b-versatile" in available_models else available_models[0]
            else:
                return "llama-3.1-8b-instant" if "llama-3.1-8b-instant" in available_models else available_models[-1]
        
        return available_models[0] if available_models else None
