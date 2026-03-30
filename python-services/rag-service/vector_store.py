import os
import time
import pymongo
from typing import List, Dict, Any, Optional
from pymongo import MongoClient
from bson.objectid import ObjectId

class VectorStore:
    def __init__(self, connection_uri: str, db_name: str, collection_name: str):
        """
        Initialize the vector store with MongoDB Atlas connection.
        """
        print(f"Connecting to MongoDB Atlas at {connection_uri}...")
        self.client = MongoClient(connection_uri)
        self.db = self.client[db_name]
        self.collection = self.db[collection_name]
        self.index_name = "vector_index" # Default name for Atlas Vector Search index

    def store_document(self, document: Dict[str, Any], embedding: List[float]) -> str:
        """
        Store a document along with its vector embedding.
        """
        doc_to_store = document.copy()
        doc_to_store['embedding'] = embedding
        doc_to_store['updated_at'] = time.time()
        
        result = self.collection.insert_one(doc_to_store)
        return str(result.inserted_id)

    def store_batch_documents(self, documents: List[Dict[str, Any]], embeddings: List[List[float]]) -> List[str]:
        """
        Batch store documents with embeddings.
        """
        if len(documents) != len(embeddings):
            raise ValueError("Documents and embeddings lists must have the same length.")
            
        docs_to_store = []
        for doc, emb in zip(documents, embeddings):
            doc_with_emb = doc.copy()
            doc_with_emb['embedding'] = emb
            doc_with_emb['updated_at'] = time.time()
            docs_to_store.append(doc_with_emb)
            
        result = self.collection.insert_many(docs_to_store)
        return [str(inserted_id) for inserted_id in result.inserted_ids]

    def vector_search(self, query_embedding: List[float], k: int = 5, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Perform vector search using MongoDB Atlas Vector Search.
        $vectorSearch stage performs top-k retrieval using cosine similarity by default.
        """
        pipeline = [
            {
                "$vectorSearch": {
                    "index": self.index_name,
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": k * 10, # Number of documents to consider for final selection
                    "limit": k
                }
            }
        ]
        
        # Add metadata filtering if provided
        if filters:
            # $vectorSearch doesn't directly support $match inside its definition in some Atlas versions.
            # Usually, you'd apply filtering as a separate stage if needed, or if supported by $vectorSearch directly.
            # For simplicity, we'll apply it as a subsequent $match stage.
            pipeline.append({"$match": filters})
            
        # Add score projection to see relevance
        pipeline.append({
            "$project": {
                "embedding": 0, # Don't return the full embedding in search results
                "score": {"$meta": "vectorSearchScore"}
            }
        })
        
        results = list(self.collection.aggregate(pipeline))
        return results

if __name__ == "__main__":
    # Example usage (requires actual MongoDB Atlas URI)
    # connection_uri = "mongodb+srv://<user>:<pass>@cluster0.mongodb.net/?retryWrites=true&w=majority"
    # vector_store = VectorStore(connection_uri, "talent_track", "candidate_evaluations")
    pass
