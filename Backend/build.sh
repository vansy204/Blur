#!/bin/bash

services=("IdentityService" "profile-service" "post-service" "story-service" "notification-service" "chat-service" "api-gateway")

for service in "${services[@]}"; do
  echo "🚀 Building $service..."
  cd $service
  mvn clean package -DskipTests
  docker build -t myrepo/$service:latest .
  cd ..
done
