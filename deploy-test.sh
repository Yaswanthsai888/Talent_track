#!/bin/bash

echo "Deploying Talent Track with Test Management System..."

# Stop all running containers
echo "Stopping existing containers..."
docker-compose down
docker-compose -f docker-compose.monitoring.yml down

# Clean up resources
echo "Cleaning up resources..."
docker system prune -f
docker volume prune -f --filter label=service=test-management

# Build and start core services
echo "Starting core services..."
docker-compose --env-file .env.production up -d --build

# Wait for backend to be healthy
echo "Waiting for backend to be ready..."
until curl -f http://localhost:5000/health; do
  echo "Backend is starting..."
  sleep 5
done

# Start monitoring stack
echo "Starting monitoring services..."
docker-compose -f docker-compose.monitoring.yml up -d

# Initialize Grafana dashboards
echo "Setting up monitoring dashboards..."
./scripts/init-grafana-dashboards.sh

# Run test service verification
echo "Verifying test services..."
curl -f http://localhost:5000/api/tests/health
curl -f http://localhost:5002/health

echo "Deployment complete! Services are running at:"
echo "Frontend: http://localhost"
echo "Backend API: http://localhost:5000"
echo "Monitoring: http://localhost:3000"
echo "Code Evaluator: http://localhost:5002"

# Watch logs
docker-compose logs -f
