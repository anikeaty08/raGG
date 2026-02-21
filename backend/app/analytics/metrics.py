from pydantic import BaseModel
from typing import Optional, Dict, Any
from collections import defaultdict
import time

class QueryMetrics(BaseModel):
    query_id: str
    provider: str
    model: str
    tokens_used: int
    cost: float
    duration_ms: float
    success: bool
    error: Optional[str] = None

class MetricsCollector:
    def __init__(self):
        self.queries: list[QueryMetrics] = []
        
    def record_query(self, metrics: QueryMetrics):
        self.queries.append(metrics)
        
    def get_total_stats(self) -> Dict[str, Any]:
        total_queries = len(self.queries)
        if not total_queries:
            return {
                "total_queries": 0,
                "total_tokens": 0,
                "total_cost": 0.0,
                "avg_duration_ms": 0.0,
                "success_rate": 0.0
            }
            
        total_tokens = sum(q.tokens_used for q in self.queries)
        total_cost = sum(q.cost for q in self.queries)
        avg_duration = sum(q.duration_ms for q in self.queries) / total_queries
        success_count = sum(1 for q in self.queries if q.success)
        
        return {
            "total_queries": total_queries,
            "total_tokens": total_tokens,
            "total_cost": total_cost,
            "avg_duration_ms": avg_duration,
            "success_rate": success_count / total_queries if total_queries else 0.0
        }
        
    def get_provider_stats(self, provider: str) -> Dict[str, Any]:
        provider_queries = [q for q in self.queries if q.provider.lower() == provider.lower()]
        total_queries = len(provider_queries)
        if not total_queries:
            return {"provider": provider, "total_queries": 0}
            
        total_tokens = sum(q.tokens_used for q in provider_queries)
        total_cost = sum(q.cost for q in provider_queries)
        avg_duration = sum(q.duration_ms for q in provider_queries) / total_queries
        
        return {
            "provider": provider,
            "total_queries": total_queries,
            "total_tokens": total_tokens,
            "total_cost": total_cost,
            "avg_duration_ms": avg_duration
        }

metrics_collector = MetricsCollector()
