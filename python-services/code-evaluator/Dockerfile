FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    cgroup-tools \
    seccomp \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set resource limits before switching user
RUN echo "evaluator soft nproc 50" >> /etc/security/limits.conf && \
    echo "evaluator hard nproc 100" >> /etc/security/limits.conf && \
    echo "evaluator soft nofile 1024" >> /etc/security/limits.conf

# Copy requirements and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Security configurations - create user and set permissions
RUN useradd -m -s /bin/bash evaluator && \
    chown -R evaluator:evaluator /app && \
    chmod 500 /app

# Environment variables for code execution
ENV PYTHON_PATH=/usr/local/bin/python3
ENV MAX_CODE_LENGTH=50000
ENV EXECUTION_TIMEOUT=10
ENV MAX_MEMORY=256M
ENV SANDBOX_ENABLED=true

# Switch to non-root user after all system configurations are done
USER evaluator

EXPOSE 5002

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5002/health || exit 1

CMD ["python", "app.py"]
