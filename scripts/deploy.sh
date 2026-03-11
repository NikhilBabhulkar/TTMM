#!/bin/bash

# Deployment script for Splitwise application
# This script deploys the application to Kubernetes

set -e

echo "🚀 Starting Splitwise deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed${NC}"
    exit 1
fi

# Check if connected to cluster
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Not connected to Kubernetes cluster${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Connected to Kubernetes cluster${NC}"

# Create namespace
echo -e "${YELLOW}Creating namespace...${NC}"
kubectl apply -f k8s/namespace.yaml

# Apply secrets
echo -e "${YELLOW}Applying secrets...${NC}"
kubectl apply -f k8s/secrets.yaml

# Apply configmap
echo -e "${YELLOW}Applying configmap...${NC}"
kubectl apply -f k8s/configmap.yaml

# Deploy PostgreSQL
echo -e "${YELLOW}Deploying PostgreSQL...${NC}"
kubectl apply -f k8s/postgres-deployment.yaml

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres -n splitwise --timeout=120s

# Deploy backend
echo -e "${YELLOW}Deploying backend...${NC}"
kubectl apply -f k8s/backend-deployment.yaml

# Deploy frontend
echo -e "${YELLOW}Deploying frontend...${NC}"
kubectl apply -f k8s/frontend-deployment.yaml

# Deploy ingress
echo -e "${YELLOW}Deploying ingress...${NC}"
kubectl apply -f k8s/ingress.yaml

# Wait for deployments
echo -e "${YELLOW}Waiting for deployments to be ready...${NC}"
kubectl wait --for=condition=available deployment/backend -n splitwise --timeout=120s
kubectl wait --for=condition=available deployment/frontend -n splitwise --timeout=120s

# Show status
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Status:"
kubectl get all -n splitwise

echo ""
echo "Access the application:"
echo "  Frontend: http://splitwise.local"
echo "  Backend: http://splitwise.local/api"
echo ""
echo "Useful commands:"
echo "  kubectl get pods -n splitwise"
echo "  kubectl logs -f deployment/backend -n splitwise"
echo "  kubectl logs -f deployment/frontend -n splitwise"
