FROM python:3.9-slim-bullseye

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install numpy first
RUN pip install numpy==1.23.5

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spacy model
RUN python -m spacy download en_core_web_sm

# Copy application files
COPY . .

# Create directories with correct permissions
RUN mkdir -p /app/temp /app/test_resumes && \
    chmod -R 777 /app/temp /app/test_resumes

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    FLASK_APP=app.py \
    SPACY_MODEL=en_core_web_sm \
    PYTHONPATH=/app

EXPOSE 5001

# Use Flask development server
CMD ["python", "app.py"]