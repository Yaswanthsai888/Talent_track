#!/bin/bash

echo "Testing test management services..."

# Test backend API endpoints
echo "Testing backend endpoints..."
curl -f http://localhost:5000/health || exit 1
curl -f http://localhost:5000/api/tests/health || exit 1

# Test code evaluator
echo "Testing code evaluator..."
curl -f http://localhost:5002/health || exit 1

# Test monitoring
echo "Testing monitoring stack..."
curl -f http://localhost:9090/-/healthy || exit 1
curl -f http://localhost:3000/api/health || exit 1

echo "All test services are healthy!"
