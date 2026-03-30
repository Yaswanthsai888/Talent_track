#!/bin/bash

# Wait for Grafana to be ready
echo "Waiting for Grafana to be ready..."
until $(curl --output /dev/null --silent --head --fail http://localhost:3000); do
    printf '.'
    sleep 5
done

# Add Prometheus data source
curl -X POST -H "Content-Type: application/json" \
    -d '{"name":"Prometheus","type":"prometheus","url":"http://prometheus:9090","access":"proxy"}' \
    http://admin:admin@localhost:3000/api/datasources

# Add Test Analytics Dashboard
curl -X POST -H "Content-Type: application/json" \
    -d @dashboards/test-analytics.json \
    http://admin:admin@localhost:3000/api/dashboards/db
