from typing import List, Dict, Any, Optional
from app.rag.providers.base import LLMProvider, LLMMessage


class AnswerVerifier:
    """Verify answers with cross-source checking."""
    
    def __init__(self, provider: Optional[LLMProvider] = None):
        self.provider = provider
    
    async def verify(
        self,
        answer: str,
        sources: List[Dict[str, Any]],
        query: str
    ) -> Dict[str, Any]:
        """Verify answer against sources."""
        
        verification = {
            "verified": True,
            "confidence": 0.8,
            "issues": [],
            "source_agreement": 0.0
        }
        
        if not sources:
            verification["verified"] = False
            verification["confidence"] = 0.0
            verification["issues"].append("No sources available for verification")
            return verification
        
        # Check source agreement
        source_contents = [s.get("content", "") for s in sources]
        agreement_score = self._calculate_agreement(source_contents)
        verification["source_agreement"] = agreement_score
        
        # Simple verification heuristics
        # Can be enhanced with LLM-based verification
        
        # Check if answer mentions key terms from sources
        source_keywords = self._extract_keywords(source_contents)
        answer_keywords = self._extract_keywords([answer])
        
        overlap = len(set(source_keywords) & set(answer_keywords))
        total = len(set(source_keywords))
        
        if total > 0:
            verification["confidence"] = overlap / total
        
        if verification["confidence"] < 0.5:
            verification["verified"] = False
            verification["issues"].append("Low confidence: answer may not align with sources")
        
        return verification
    
    def _calculate_agreement(self, contents: List[str]) -> float:
        """Calculate agreement score between sources."""
        if len(contents) < 2:
            return 1.0
        
        # Simple heuristic: check for common keywords
        # In production, use semantic similarity
        keywords_sets = [set(self._extract_keywords([c])) for c in contents]
        
        if not keywords_sets:
            return 0.0
        
        # Calculate pairwise Jaccard similarity
        similarities = []
        for i in range(len(keywords_sets)):
            for j in range(i + 1, len(keywords_sets)):
                intersection = len(keywords_sets[i] & keywords_sets[j])
                union = len(keywords_sets[i] | keywords_sets[j])
                if union > 0:
                    similarities.append(intersection / union)
        
        return sum(similarities) / len(similarities) if similarities else 0.0
    
    def _extract_keywords(self, texts: List[str]) -> List[str]:
        """Extract keywords from texts (simple heuristic)."""
        import re
        keywords = []
        for text in texts:
            # Extract words (simple approach)
            words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
            keywords.extend(words[:20])  # Limit to top 20
        return keywords
