import os
import time
import numpy as np
import torch
from typing import List, Union, Dict
from sentence_transformers import SentenceTransformer
from functools import lru_cache

class EmbeddingPipeline:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        """
        Initialize the embedding pipeline with the specified model.
        all-MiniLM-L6-v2 produces 384-dimensional embeddings.
        """
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"Loading embedding model '{model_name}' on {self.device}...")
        self.model = SentenceTransformer(model_name, device=self.device)
        self.dimension = self.model.get_sentence_embedding_dimension()
        print(f"Model loaded. Dimension: {self.dimension}")

    @lru_cache(maxsize=1000)
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single piece of text.
        Includes LRU caching for performance optimization.
        """
        if not text:
            return [0.0] * self.dimension
        
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    def generate_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts in a single batch.
        """
        if not texts:
            return []
        
        embeddings = self.model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        return embeddings.tolist()

    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings.
        """
        e1 = np.array(embedding1)
        e2 = np.array(embedding2)
        
        dot_product = np.dot(e1, e2)
        norm_e1 = np.linalg.norm(e1)
        norm_e2 = np.linalg.norm(e2)
        
        if norm_e1 == 0 or norm_e2 == 0:
            return 0.0
            
        return float(dot_product / (norm_e1 * norm_e2))

if __name__ == "__main__":
    # Test the pipeline
    pipeline = EmbeddingPipeline()
    test_text = "This is a test document for candidate evaluation."
    emb = pipeline.generate_embedding(test_text)
    print(f"Test embedding length: {len(emb)}")
    
    batch_texts = ["Python developer", "Java specialist", "Frontend engineer"]
    batch_embs = pipeline.generate_batch_embeddings(batch_texts)
    print(f"Batch embeddings generated: {len(batch_embs)}")
