import os
import sys
import json
import uuid
import docker
import traceback
from typing import Dict, Any
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Security configurations
SANDBOX_BASE_DIR = '/tmp/code_executor'
SUPPORTED_LANGUAGES = {
    'python': {
        'image': 'python:3.9-slim',
        'file_extension': '.py',
        'compile_cmd': None,
        'run_cmd': ['python']
    },
    'javascript': {
        'image': 'node:14-alpine',
        'file_extension': '.js',
        'compile_cmd': None,
        'run_cmd': ['node']
    },
    'java': {
        'image': 'openjdk:11-jdk-slim',
        'file_extension': '.java',
        'compile_cmd': ['javac'],
        'run_cmd': ['java']
    }
}

def create_secure_execution_environment(language: str, code: str, test_cases: list) -> Dict[str, Any]:
    """
    Create a secure Docker-based execution environment for code
    """
    if language not in SUPPORTED_LANGUAGES:
        return {
            'error': f'Unsupported language: {language}',
            'status': 'error'
        }

    try:
        # Generate unique execution ID
        exec_id = str(uuid.uuid4())
        exec_dir = os.path.join(SANDBOX_BASE_DIR, exec_id)
        os.makedirs(exec_dir, exist_ok=True)

        # Prepare language-specific configuration
        lang_config = SUPPORTED_LANGUAGES[language]
        source_file = os.path.join(exec_dir, f'solution{lang_config["file_extension"]}')
        
        # Write source code
        with open(source_file, 'w') as f:
            f.write(code)

        # Prepare test cases file
        test_cases_file = os.path.join(exec_dir, 'test_cases.json')
        with open(test_cases_file, 'w') as f:
            json.dump(test_cases, f)

        # Docker client
        client = docker.from_env()

        # Mount volumes and run container
        volumes = {
            exec_dir: {'bind': '/workspace', 'mode': 'rw'}
        }

        # Compile step for languages requiring compilation
        if lang_config['compile_cmd']:
            compile_container = client.containers.run(
                lang_config['image'],
                command=lang_config['compile_cmd'] + [f'/workspace/solution{lang_config["file_extension"]}'],
                volumes=volumes,
                remove=True
            )

        # Run code with test cases
        run_result = client.containers.run(
            lang_config['image'],
            command=lang_config['run_cmd'] + [f'/workspace/solution{lang_config["file_extension"]}'],
            volumes=volumes,
            remove=True,
            stderr=True
        )

        # Process results
        return {
            'status': 'success',
            'output': run_result.decode('utf-8'),
            'execution_id': exec_id
        }

    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'trace': traceback.format_exc()
        }
    finally:
        # Clean up execution directory
        try:
            import shutil
            shutil.rmtree(exec_dir, ignore_errors=True)
        except:
            pass

@app.route('/execute', methods=['POST'])
def execute_code():
    """
    Execute code with test cases in a secure sandbox
    """
    data = request.json
    
    required_fields = ['language', 'code', 'test_cases']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'status': 'error',
                'message': f'Missing required field: {field}'
            }), 400

    result = create_secure_execution_environment(
        data['language'], 
        data['code'], 
        data['test_cases']
    )

    return jsonify(result)

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'supported_languages': list(SUPPORTED_LANGUAGES.keys())
    })

if __name__ == '__main__':
    # Ensure base sandbox directory exists
    os.makedirs(SANDBOX_BASE_DIR, exist_ok=True)
    app.run(host='0.0.0.0', port=5002)
