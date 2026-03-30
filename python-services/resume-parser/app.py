import os
import re
import json
import spacy
import pdfplumber
import docx
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    logger.warning("Downloading spaCy model...")
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

app = Flask(__name__)
CORS(app)

# Predefined skill lists
TECH_SKILLS = {
    'programming': ['python', 'java', 'javascript', 'c++', 'ruby', 'php', 'swift', 'kotlin', 
                    'typescript', 'go', 'rust', 'scala', 'perl'],
    'web_technologies': ['html', 'css', 'react', 'angular', 'vue', 'django', 'flask', 
                         'nodejs', 'express', 'spring', 'laravel'],
    'databases': ['mysql', 'postgresql', 'mongodb', 'sqlite', 'oracle', 'sqlserver', 
                  'redis', 'cassandra', 'dynamodb'],
    'cloud_platforms': ['aws', 'azure', 'gcp', 'heroku', 'digital ocean'],
    'devops': ['docker', 'kubernetes', 'jenkins', 'gitlab', 'github actions', 'travis ci'],
    'machine_learning': ['tensorflow', 'pytorch', 'scikit-learn', 'keras', 'nlp', 'computer vision']
}

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file."""
    try:
        with pdfplumber.open(file_path) as pdf:
            return ' '.join(page.extract_text() for page in pdf.pages if page.extract_text())
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        return ""

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file."""
    try:
        doc = docx.Document(file_path)
        return ' '.join(paragraph.text for paragraph in doc.paragraphs)
    except Exception as e:
        logger.error(f"DOCX extraction error: {e}")
        return ""

def extract_skills(text: str) -> List[str]:
    """Extract skills from text using predefined lists and NLP."""
    skills = set()
    text_lower = text.lower()

    # Extract skills from predefined lists
    for category, skill_list in TECH_SKILLS.items():
        skills.update([skill for skill in skill_list if skill in text_lower])

    # Use spaCy for named entity recognition
    doc = nlp(text)
    
    # Extract potential skills from named entities and noun chunks
    for ent in doc.ents:
        if ent.label_ in ['ORG', 'PRODUCT', 'WORK_OF_ART']:
            skills.add(ent.text.lower())

    for chunk in doc.noun_chunks:
        if len(chunk.text.split()) <= 3:
            skills.add(chunk.text.lower())

    return list(skills)

def parse_resume(file_path: str) -> Dict[str, Any]:
    """Parse resume and extract relevant information."""
    file_ext = os.path.splitext(file_path)[1].lower()
    
    # Extract text based on file type
    if file_ext == '.pdf':
        text = extract_text_from_pdf(file_path)
    elif file_ext in ['.docx', '.doc']:
        text = extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_ext}")

    # Extract skills
    skills = extract_skills(text)

    # Basic information extraction
    doc = nlp(text)
    
    # Extract potential contact information
    email = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
    phone = re.findall(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', text)

    return {
        'skills': skills,
        'email': email[0] if email else None,
        'phone': phone[0] if phone else None,
        'raw_text': text
    }

@app.route('/parse', methods=['POST'])
def parse_resume_endpoint():
    """Endpoint for resume parsing."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    
    # Save temporary file
    temp_dir = '/tmp/resumes'
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, file.filename)
    file.save(file_path)

    try:
        result = parse_resume(file_path)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Resume parsing error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        # Clean up temporary file
        os.remove(file_path)

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'services': {
            'spacy': 'loaded',
            'pdf_parsing': 'enabled',
            'docx_parsing': 'enabled'
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
