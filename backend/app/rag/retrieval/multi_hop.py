from typing import List, Dict, Any, Optional
from app.rag.vectorstore import VectorStore
from app.rag.retrieval.query_expander import QueryExpander
from app.rag.retrieval.reranker import Reranker


class MultiHopRetrieval:
    """Multi-hop retrieval with query expansion and re-ranking."""
    
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store
        self.query_expander = QueryExpander()
        self.reranker = Reranker()
    
    async def retrieve(
        self,
        query: str,
        top_k: int = 5,
        max_hops: int = 2,
        source_filter: Optional[str] = None,
        user_id: str = "default"
    ) -> List[Dict[str, Any]]:
        """Perform multi-hop retrieval."""
        
        all_results = []
        current_query = query
        
        for hop in range(max_hops):
            # Retrieve chunks
            results = await self.vector_store.search(
                query=current_query,
                top_k=top_k * 2,  # Retrieve more for re-ranking
                source_filter=source_filter,
                user_id=user_id
            )
            
            if not results:
                break
            
            # Re-rank results
            reranked = await self.reranker.rerank(
                query=current_query,
                documents=results,
                top_k=top_k
            )
            
            all_results.extend(reranked)
            
            # Expand query for next hop if needed
            if hop < max_hops - 1:
                expanded_queries = await self.query_expander.expand(
                    original_query=query,
                    retrieved_context=[r.get("content", "") for r in reranked]
                )
                if expanded_queries:
                    current_query = expanded_queries[0]
        
        # Deduplicate and return top results
        seen = set()
        unique_results = []
        for result in all_results:
            content_id = result.get("id") or hash(result.get("content", ""))
            if content_id not in seen:
                seen.add(content_id)
                unique_results.append(result)
        
        return unique_results[:top_k]
