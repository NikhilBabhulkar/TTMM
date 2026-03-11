#!/bin/bash

# Cleanup script for Splitwise application
# This script removes all Kubernetes resources

set -e

echo "🧹 Cleaning up Splitwise deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Confirm deletion
read -p "Are you sure you want to delete all Splitwise resources? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled"
    exit 0
fi

echo -e "${YELLOW}Deleting all resources in splitwise namespace...${NC}"

# Delete all resources
kubectl delete -f k8s/ingress.yaml --ignore-not-found=true
kubectl delete -f k8s/frontend-deployment.yaml --ignore-not-found=true
kubectl delete -f k8s/backend-deployment.yaml --ignore-not-found=true
kubectl delete -f k8s/postgres-deployment.yaml --ignore-not-found=true
kubectl delete -f k8s/configmap.yaml --ignore-not-found=true
kubectl delete -f k8s/secrets.yaml --ignore-not-found=true

# Delete namespace (this will delete everything in it)
kubectl delete namespace splitwise --ignore-not-found=true

echo -e "${GREEN}✅ Cleanup complete!${NC}"
