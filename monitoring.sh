#!/bin/bash

# Check Frontend
echo "Checking Frontend..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:80/health

# Check Backend
echo "Checking Backend..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health

# Check MongoDB
echo "Checking MongoDB..."
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"

# Check Redis
echo "Checking Redis..."
docker-compose exec redis redis-cli ping

# Check Services Status
docker-compose ps
