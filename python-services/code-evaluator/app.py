from flask import Flask, jsonify
from flask_cors import CORS
import time
import platform

app = Flask(__name__)
CORS(app)

start_time = time.time()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'uptime': time.time() - start_time,
        'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
        'python_version': platform.python_version()
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
