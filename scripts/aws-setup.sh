#!/bin/bash

# AWS EKS Setup Script for Splitwise Application
# This script automates the setup of EKS cluster and required components

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CLUSTER_NAME="splitwise-cluster"
REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")

echo -e "${GREEN}🚀 AWS EKS Setup for Splitwise${NC}"
echo "=================================="
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi
echo -e "${GREEN}✓ AWS CLI installed${NC}"

# Check AWS credentials
if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi
echo -e "${GREEN}✓ AWS credentials configured (Account: $ACCOUNT_ID)${NC}"

# Check eksctl
if ! command -v eksctl &> /dev/null; then
    echo -e "${YELLOW}⚠ eksctl not found. Installing...${NC}"
    curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
    sudo mv /tmp/eksctl /usr/local/bin
    echo -e "${GREEN}✓ eksctl installed${NC}"
else
    echo -e "${GREEN}✓ eksctl installed${NC}"
fi

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found. Please install it first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ kubectl installed${NC}"

# Check helm
if ! command -v helm &> /dev/null; then
    echo -e "${YELLOW}⚠ helm not found. Installing...${NC}"
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
    echo -e "${GREEN}✓ helm installed${NC}"
else
    echo -e "${GREEN}✓ helm installed${NC}"
fi

echo ""
echo -e "${YELLOW}Prerequisites check complete!${NC}"
echo ""

# Ask user to confirm
echo -e "${YELLOW}⚠ WARNING: This will create AWS resources that cost money!${NC}"
echo "Estimated cost: ~\$133/month (EKS + 2 t3.medium nodes)"
echo ""
read -p "Do you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Setup cancelled."
    exit 0
fi

echo ""
echo -e "${GREEN}Step 1: Creating EKS Cluster${NC}"
echo "This will take 15-20 minutes..."
echo ""

# Check if cluster already exists
if eksctl get cluster --name $CLUSTER_NAME --region $REGION &> /dev/null; then
    echo -e "${YELLOW}⚠ Cluster $CLUSTER_NAME already exists${NC}"
    read -p "Do you want to use the existing cluster? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Please delete the existing cluster first:"
        echo "eksctl delete cluster --name $CLUSTER_NAME --region $REGION"
        exit 1
    fi
else
    eksctl create cluster -f eks-cluster.yaml
    echo -e "${GREEN}✓ EKS Cluster created${NC}"
fi

echo ""
echo -e "${GREEN}Step 2: Configuring kubectl${NC}"
aws eks update-kubeconfig --name $CLUSTER_NAME --region $REGION
echo -e "${GREEN}✓ kubectl configured${NC}"

echo ""
echo -e "${GREEN}Step 3: Verifying cluster${NC}"
kubectl get nodes
echo -e "${GREEN}✓ Cluster is ready${NC}"

echo ""
echo -e "${GREEN}Step 4: Installing AWS Load Balancer Controller${NC}"

# Download IAM policy
echo "Downloading IAM policy..."
curl -o iam-policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.0/docs/install/iam_policy.json

# Create IAM policy (ignore if already exists)
echo "Creating IAM policy..."
aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam-policy.json 2>/dev/null || echo "Policy already exists"

# Create IAM service account
echo "Creating IAM service account..."
eksctl create iamserviceaccount \
  --cluster=$CLUSTER_NAME \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::${ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve \
  --override-existing-serviceaccounts

# Install controller with Helm
echo "Installing AWS Load Balancer Controller..."
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=$CLUSTER_NAME \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=$REGION \
  --set vpcId=$(aws eks describe-cluster --name $CLUSTER_NAME --region $REGION --query "cluster.resourcesVpcConfig.vpcId" --output text) \
  2>/dev/null || helm upgrade aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=$CLUSTER_NAME \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=$REGION \
  --set vpcId=$(aws eks describe-cluster --name $CLUSTER_NAME --region $REGION --query "cluster.resourcesVpcConfig.vpcId" --output text)

echo "Waiting for controller to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/aws-load-balancer-controller -n kube-system

echo -e "${GREEN}✓ AWS Load Balancer Controller installed${NC}"

echo ""
echo -e "${GREEN}Step 5: Installing Metrics Server (for autoscaling)${NC}"
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
echo -e "${GREEN}✓ Metrics Server installed${NC}"

echo ""
echo -e "${GREEN}✅ AWS EKS Setup Complete!${NC}"
echo ""
echo "Cluster Information:"
echo "  Name: $CLUSTER_NAME"
echo "  Region: $REGION"
echo "  Account: $ACCOUNT_ID"
echo ""
echo "Next steps:"
echo "  1. Deploy your application: ./scripts/deploy-to-aws.sh"
echo "  2. Check cluster status: kubectl get nodes"
echo "  3. View all resources: kubectl get all --all-namespaces"
echo ""
echo "To delete the cluster (and stop charges):"
echo "  eksctl delete cluster --name $CLUSTER_NAME --region $REGION"
echo ""
