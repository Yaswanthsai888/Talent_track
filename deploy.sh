#!/bin/bash

# Stop and remove existing containers
docker-compose down
docker-compose -f docker-compose.monitoring.yml down

# Remove unused images and volumes
docker system prune -f
docker volume prune -f

# Build and start services with production env
docker-compose --env-file .env.production up -d --build
docker-compose -f docker-compose.monitoring.yml up -d

# Initialize monitoring dashboards
./scripts/init-grafana-dashboards.sh

# Run tests to verify deployment
./scripts/test-services.sh

# Watch logs
docker-compose logs -f
