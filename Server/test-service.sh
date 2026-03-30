#!/bin/bash

echo "Testing backend service..."

# Test MongoDB connection
curl -f http://localhost:5000/health | grep '"database":"connected"' || exit 1

# Test resume parser connection
curl -f http://localhost:5001/health || exit 1

echo "All services are healthy!"
