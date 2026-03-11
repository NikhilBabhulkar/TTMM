#!/bin/bash

# Build and push Docker images to Docker Hub
# Usage: ./scripts/build-and-push.sh YOUR_DOCKERHUB_USERNAME

set -e

# Check if username is provided
if [ -z "$1" ]; then
    echo "Usage: ./scripts/build-and-push.sh YOUR_DOCKERHUB_USERNAME"
    exit 1
fi

DOCKER_USERNAME=$1
VERSION=${2:-latest}

echo "🐳 Building and pushing Docker images..."
echo "Username: $DOCKER_USERNAME"
echo "Version: $VERSION"

# Build backend
echo "Building backend..."
docker build -t $DOCKER_USERNAME/splitwise-backend:$VERSION ./backend
docker tag $DOCKER_USERNAME/splitwise-backend:$VERSION $DOCKER_USERNAME/splitwise-backend:latest

# Build frontend
echo "Building frontend..."
docker build -t $DOCKER_USERNAME/splitwise-frontend:$VERSION ./frontend
docker tag $DOCKER_USERNAME/splitwise-frontend:$VERSION $DOCKER_USERNAME/splitwise-frontend:latest

# Login to Docker Hub
echo "Logging in to Docker Hub..."
docker login

# Push images
echo "Pushing backend..."
docker push $DOCKER_USERNAME/splitwise-backend:$VERSION
docker push $DOCKER_USERNAME/splitwise-backend:latest

echo "Pushing frontend..."
docker push $DOCKER_USERNAME/splitwise-frontend:$VERSION
docker push $DOCKER_USERNAME/splitwise-frontend:latest

echo "✅ Images pushed successfully!"
echo ""
echo "Backend: $DOCKER_USERNAME/splitwise-backend:$VERSION"
echo "Frontend: $DOCKER_USERNAME/splitwise-frontend:$VERSION"
