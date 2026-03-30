import time
import numpy as np
from typing import List, Dict, Any, Optional

class EvaluationFramework:
    def __init__(self):
        """
        Initialize the evaluation framework to track performance metrics.
        """
        self.metrics_log = []
        self.relevance_scores = []
        self.latency_log = []

    def start_timer(self) -> float:
        """
        Start timing an operation.
        """
        return time.time()

    def stop_timer(self, start_time: float) -> float:
        """
        Stop timing and return the elapsed time in milliseconds.
        """
        elapsed_ms = (time.time() - start_time) * 1000
        self.latency_log.append(elapsed_ms)
        return elapsed_ms

    def log_manual_relevance(self, query_id: str, retrieved_docs: List[Dict[str, Any]], score: int):
        """
        Log manual relevance score (1-5 scale) for a retrieval query.
        """
        if not (1 <= score <= 5):
            raise ValueError("Manual relevance score must be between 1 and 5.")
            
        relevance_entry = {
            'query_id': query_id,
            'retrieved_count': len(retrieved_docs),
            'manual_score': score,
            'timestamp': time.time()
        }
        self.relevance_scores.append(relevance_entry)

    def check_faithfulness(self, generated_response: str, source_context: str) -> float:
        """
        A heuristic-based faithfulness check (0.0 to 1.0).
        In a real RAG system, this could involve cross-referencing named entities
        or using an NLI model. For now, we'll use a basic word-overlap check.
        """
        # Simple word overlap faithfulness check
        source_words = set(source_context.lower().split())
        gen_words = set(generated_response.lower().split())
        
        # Stop words removal for better check
        stop_words = {'the', 'a', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'by', 'to', 'for', 'with', 'and', 'or', 'but'}
        source_filtered = source_words - stop_words
        gen_filtered = gen_words - stop_words
        
        if not gen_filtered:
            return 0.0
            
        overlap = gen_filtered.intersection(source_filtered)
        faithfulness_ratio = len(overlap) / len(gen_filtered)
        
        return min(faithfulness_ratio * 1.5, 1.0) # Scale up to compensate for simple logic

    def get_summary_metrics(self) -> Dict[str, Any]:
        """
        Get aggregated performance metrics for the evaluation dashboard.
        """
        avg_latency = np.mean(self.latency_log) if self.latency_log else 0.0
        p95_latency = np.percentile(self.latency_log, 95) if self.latency_log else 0.0
        
        avg_relevance = np.mean([s['manual_score'] for s in self.relevance_scores]) if self.relevance_scores else 0.0
        relevance_percentage = (avg_relevance / 5.0) * 100 if avg_relevance else 0.0
        
        return {
            'latency': {
                'average_ms': float(avg_latency),
                'p95_ms': float(p95_latency),
                'total_queries': len(self.latency_log)
            },
            'relevance': {
                'average_manual_score': float(avg_relevance),
                'relevance_percentage': float(relevance_percentage),
                'total_evaluations': len(self.relevance_scores)
            },
            'target_met': {
                'latency_target': avg_latency < 100,
                'relevance_target': relevance_percentage >= 80
            }
        }

if __name__ == "__main__":
    # Test evaluation framework
    eval_fw = EvaluationFramework()
    
    # Simulate latency logging
    for _ in range(10):
        start = eval_fw.start_timer()
        time.sleep(0.05) # Simulate operation
        eval_fw.stop_timer(start)
        
    # Simulate manual relevance logging
    eval_fw.log_manual_relevance("q1", [{}], 4)
    eval_fw.log_manual_relevance("q2", [{}, {}], 5)
    
    print(eval_fw.get_summary_metrics())
