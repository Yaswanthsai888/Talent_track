import os
import json
import spacy
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

# Load NLP models
nlp = spacy.load('en_core_web_sm')

class AIEvaluator:
    def __init__(self):
        self.vectorizer = TfidfVectorizer()

    def evaluate_subjective_response(self, question: str, response: str) -> dict:
        """
        Evaluate subjective response using NLP techniques
        """
        # Preprocess texts
        processed_question = self._preprocess_text(question)
        processed_response = self._preprocess_text(response)

        # Semantic similarity
        semantic_score = self._calculate_semantic_similarity(processed_question, processed_response)

        # Length analysis
        length_score = self._analyze_response_length(response)

        # Keyword extraction
        keyword_match_score = self._extract_keywords(processed_question, processed_response)

        # Combine scores with weighted average
        total_score = (
            0.4 * semantic_score + 
            0.3 * length_score + 
            0.3 * keyword_match_score
        ) * 10  # Scale to 0-10

        return {
            'score': min(max(total_score, 0), 10),
            'details': {
                'semantic_similarity': semantic_score,
                'length_score': length_score,
                'keyword_match': keyword_match_score
            }
        }

    def _preprocess_text(self, text: str) -> str:
        """
        Preprocess text using spaCy
        """
        doc = nlp(text.lower())
        tokens = [token.lemma_ for token in doc if not token.is_stop and token.is_alpha]
        return ' '.join(tokens)

    def _calculate_semantic_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate semantic similarity using TF-IDF and cosine similarity
        """
        corpus = [text1, text2]
        tfidf_matrix = self.vectorizer.fit_transform(corpus)
        return cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

    def _analyze_response_length(self, response: str) -> float:
        """
        Score based on response length
        """
        words = response.split()
        if len(words) < 20:
            return 0.2
        elif len(words) < 50:
            return 0.5
        elif len(words) < 100:
            return 0.7
        else:
            return 1.0

    def _extract_keywords(self, question: str, response: str) -> float:
        """
        Extract and match keywords
        """
        question_doc = nlp(question)
        response_doc = nlp(response)

        question_keywords = set([token.lemma_ for token in question_doc if token.pos_ in ['NOUN', 'VERB', 'ADJ']])
        response_keywords = set([token.lemma_ for token in response_doc if token.pos_ in ['NOUN', 'VERB', 'ADJ']])

        keyword_overlap = len(question_keywords.intersection(response_keywords))
        keyword_match_ratio = keyword_overlap / len(question_keywords) if question_keywords else 0

        return min(keyword_match_ratio, 1.0)

    def evaluate_code_solution(self, question: str, solution: str, language: str) -> dict:
        """
        Preliminary code solution evaluation
        """
        # Basic code analysis
        code_metrics = {
            'length': len(solution),
            'complexity': self._calculate_code_complexity(solution, language),
            'style_score': self._analyze_code_style(solution, language)
        }

        # Combine metrics
        total_score = (
            0.4 * (code_metrics['length'] / 1000) +  # Normalize length
            0.3 * (1 - code_metrics['complexity']) +  # Lower complexity is better
            0.3 * code_metrics['style_score']
        ) * 10  # Scale to 0-10

        return {
            'score': min(max(total_score, 0), 10),
            'metrics': code_metrics
        }

    def _calculate_code_complexity(self, code: str, language: str) -> float:
        """
        Estimate code complexity (cyclomatic complexity)
        """
        # Simple complexity estimation
        complexity_factors = {
            'python': ['if', 'elif', 'else', 'for', 'while', 'and', 'or', 'except'],
            'javascript': ['if', 'else', 'for', 'while', 'switch', '&&', '||', 'catch'],
            'java': ['if', 'else', 'for', 'while', 'switch', '&&', '||', 'catch']
        }

        factors = complexity_factors.get(language, [])
        complexity_count = sum(code.count(factor) for factor in factors)
        
        return min(complexity_count / 50, 1.0)  # Normalize

    def _analyze_code_style(self, code: str, language: str) -> float:
        """
        Basic code style analysis
        """
        style_checks = {
            'indentation': len(set(len(line) - len(line.lstrip()) for line in code.split('\n') if line.strip())) < 3,
            'naming_convention': all(
                not any(char.isupper() for char in word) 
                for word in code.split() if len(word) > 3
            ),
            'comments': code.count('#') > 0 or code.count('//') > 0
        }

        return sum(style_checks.values()) / len(style_checks)

ai_evaluator = AIEvaluator()

@app.route('/evaluate/subjective', methods=['POST'])
def evaluate_subjective():
    data = request.json
    required_fields = ['question', 'response']
    
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing {field}'}), 400

    result = ai_evaluator.evaluate_subjective_response(
        data['question'], 
        data['response']
    )
    return jsonify(result)

@app.route('/evaluate/code', methods=['POST'])
def evaluate_code():
    data = request.json
    required_fields = ['question', 'solution', 'language']
    
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing {field}'}), 400

    result = ai_evaluator.evaluate_code_solution(
        data['question'], 
        data['solution'], 
        data['language']
    )
    return jsonify(result)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'nlp_model': 'en_core_web_sm',
        'supported_evaluations': ['subjective', 'code']
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003)
