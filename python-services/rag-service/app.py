import os
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Import our custom RAG components
from embedding_pipeline import EmbeddingPipeline
from vector_store import VectorStore
from prompt_manager import PromptManager
from evaluation_framework import EvaluationFramework

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize RAG components
# For production, replace the MongoDB Atlas URI with the one from your environment variables
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "talent_track")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "candidate_evaluations")

embedding_pipeline = EmbeddingPipeline()
vector_store = VectorStore(MONGO_URI, DB_NAME, COLLECTION_NAME)
prompt_manager = PromptManager()
eval_framework = EvaluationFramework()

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'rag-feedback-system',
        'model': 'all-MiniLM-L6-v2',
        'vector_dimension': embedding_pipeline.dimension
    })

@app.route('/generate-feedback', methods=['POST'])
def generate_feedback():
    """
    Main endpoint to generate personalized feedback using RAG.
    Expects: {
        "candidate_id": "...",
        "candidate_name": "...",
        "scores": {...},
        "performance_summary": "...",
        "job_id": "...",
        "job_title": "...",
        "required_skills": [...]
    }
    """
    start_time = eval_framework.start_timer()
    data = request.json
    
    # 1. Query Preprocessing & Retrieval
    query_text = f"Candidate evaluation for {data.get('job_title')} with skills {', '.join(data.get('required_skills', []))}"
    query_embedding = embedding_pipeline.generate_embedding(query_text)
    
    # Retrieve top-k context from vector store (k=3 as requested)
    retrieved_context = vector_store.vector_search(query_embedding, k=3)
    
    # 2. Prompt Generation
    candidate_info = {
        'name': data.get('candidate_name', 'Candidate'),
        'scores': data.get('scores', {}),
        'performance_summary': data.get('performance_summary', 'N/A')
    }
    
    job_info = {
        'title': data.get('job_title', 'Position'),
        'required_skills': data.get('required_skills', [])
    }
    
    try:
        # Generate the prompt using the template system
        final_prompt = prompt_manager.generate_prompt(
            'candidate_feedback', 
            retrieved_context, 
            candidate_info, 
            job_info
        )
        
        # 3. Simulate Generation (In a real system, you'd call an LLM here)
        # For this implementation, we return the generated prompt which would be sent to an LLM
        # This allows the user to see the context-aware prompt architecture.
        generated_feedback = f"Feedback generated for {candidate_info['name']} using retrieved context: {len(retrieved_context)} documents found."
        
        # 4. Final Metrics and Logging
        latency_ms = eval_framework.stop_timer(start_time)
        
        return jsonify({
            'status': 'success',
            'feedback': generated_feedback,
            'prompt_preview': final_prompt[:500] + "...", # Show a preview of the context-aware prompt
            'metrics': {
                'latency_ms': latency_ms,
                'retrieved_docs_count': len(retrieved_context)
            }
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/store-knowledge', methods=['POST'])
def store_knowledge():
    """
    Endpoint to index new knowledge (job descriptions, evaluation summaries, etc.)
    Expects: {
        "title": "...",
        "content": "...",
        "type": "job_description" | "evaluation_summary" | "candidate_answer",
        "metadata": {...}
    }
    """
    data = request.json
    content = data.get('content', '')
    
    if not content:
        return jsonify({'error': 'Content is required for indexing.'}), 400
        
    # Generate embedding for the new content
    embedding = embedding_pipeline.generate_embedding(content)
    
    # Store in MongoDB Atlas Vector Search
    doc_id = vector_store.store_document(data, embedding)
    
    return jsonify({
        'status': 'success',
        'document_id': doc_id,
        'message': 'Document indexed successfully for vector search.'
    })

@app.route('/metrics', methods=['GET'])
def get_metrics():
    """Get real-time evaluation metrics"""
    return jsonify(eval_framework.get_summary_metrics())

if __name__ == '__main__':
    # Ensure templates directory exists
    os.makedirs('templates', exist_ok=True)
    app.run(host='0.0.0.0', port=5004, debug=False)
