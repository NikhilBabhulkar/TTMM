#!/bin/bash

# Deploy Splitwise Application to AWS EKS
# This script deploys the application to an existing EKS cluster

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CLUSTER_NAME="splitwise-cluster"
REGION="us-east-1"
NAMESPACE="splitwise"

echo -e "${GREEN}🚀 Deploying Splitwise to AWS EKS${NC}"
echo "===================================="
echo ""

# Check if connected to cluster
echo -e "${YELLOW}Checking cluster connection...${NC}"
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Not connected to Kubernetes cluster${NC}"
    echo "Run: aws eks update-kubeconfig --name $CLUSTER_NAME --region $REGION"
    exit 1
fi

CURRENT_CONTEXT=$(kubectl config current-context)
echo -e "${GREEN}✓ Connected to: $CURRENT_CONTEXT${NC}"
echo ""

# Create namespace
echo -e "${BLUE}Creating namespace...${NC}"
kubectl apply -f k8s/namespace.yaml
echo -e "${GREEN}✓ Namespace created${NC}"

# Apply secrets
echo -e "${BLUE}Applying secrets...${NC}"
kubectl apply -f k8s/secrets.yaml
echo -e "${GREEN}✓ Secrets applied${NC}"

# Apply configmap
echo -e "${BLUE}Applying configmap...${NC}"
kubectl apply -f k8s/configmap.yaml
echo -e "${GREEN}✓ ConfigMap applied${NC}"

# Deploy PostgreSQL
echo -e "${BLUE}Deploying PostgreSQL...${NC}"
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml

echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

# Deploy backend
echo -e "${BLUE}Deploying backend...${NC}"
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

echo "Waiting for backend to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/backend -n $NAMESPACE
echo -e "${GREEN}✓ Backend is ready${NC}"

# Deploy frontend
echo -e "${BLUE}Deploying frontend...${NC}"
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

echo "Waiting for frontend to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/frontend -n $NAMESPACE
echo -e "${GREEN}✓ Frontend is ready${NC}"

# Deploy ingress (creates ALB)
echo -e "${BLUE}Deploying ingress (creating AWS Load Balancer)...${NC}"
kubectl apply -f k8s/ingress-aws.yaml

echo "Waiting for Load Balancer to be provisioned (this takes 2-3 minutes)..."
sleep 10

# Wait for ingress to get an address
for i in {1..30}; do
    ALB_URL=$(kubectl get ingress splitwise-ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
    if [ -n "$ALB_URL" ]; then
        break
    fi
    echo -n "."
    sleep 10
done
echo ""

if [ -z "$ALB_URL" ]; then
    echo -e "${YELLOW}⚠ Load Balancer is still being created${NC}"
    echo "Check status with: kubectl get ingress -n $NAMESPACE -w"
else
    echo -e "${GREEN}✓ Load Balancer created${NC}"
fi

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""

# Show status
echo -e "${BLUE}Current Status:${NC}"
kubectl get all -n $NAMESPACE

echo ""
echo -e "${BLUE}Ingress Status:${NC}"
kubectl get ingress -n $NAMESPACE

echo ""
if [ -n "$ALB_URL" ]; then
    echo -e "${GREEN}🌐 Application URL:${NC}"
    echo "  Frontend: http://$ALB_URL"
    echo "  Backend:  http://$ALB_URL/api"
    echo "  Health:   http://$ALB_URL/api/health"
    echo ""
    echo -e "${YELLOW}Testing backend health...${NC}"
    sleep 5
    if curl -s "http://$ALB_URL/api/health" > /dev/null; then
        echo -e "${GREEN}✓ Backend is responding${NC}"
    else
        echo -e "${YELLOW}⚠ Backend not responding yet (may take a few more minutes)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Load Balancer URL not available yet${NC}"
    echo "Get the URL with:"
    echo "  kubectl get ingress splitwise-ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'"
fi

echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  View pods:           kubectl get pods -n $NAMESPACE"
echo "  View services:       kubectl get svc -n $NAMESPACE"
echo "  View ingress:        kubectl get ingress -n $NAMESPACE"
echo "  Backend logs:        kubectl logs -f deployment/backend -n $NAMESPACE"
echo "  Frontend logs:       kubectl logs -f deployment/frontend -n $NAMESPACE"
echo "  Database logs:       kubectl logs -f deployment/postgres -n $NAMESPACE"
echo "  Describe pod:        kubectl describe pod <pod-name> -n $NAMESPACE"
echo ""
echo -e "${BLUE}Scaling:${NC}"
echo "  Scale backend:       kubectl scale deployment backend --replicas=5 -n $NAMESPACE"
echo "  Scale frontend:      kubectl scale deployment frontend --replicas=3 -n $NAMESPACE"
echo ""
echo -e "${BLUE}Update Application:${NC}"
echo "  Update backend:      kubectl set image deployment/backend backend=nikhilbabhulkar/splitwise-backend:new-tag -n $NAMESPACE"
echo "  Update frontend:     kubectl set image deployment/frontend frontend=nikhilbabhulkar/splitwise-frontend:new-tag -n $NAMESPACE"
echo ""
