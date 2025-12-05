#!/bin/bash
set -e

echo "🚀 Deploying..."

docker-compose -f docker-compose.prod.yaml pull
docker-compose -f docker-compose.prod.yaml down
docker-compose -f docker-compose.prod.yaml up -d

echo "⏳ Waiting 90s..."
sleep 90

docker-compose -f docker-compose.prod.yaml ps

echo "✅ Done! http://localhost"