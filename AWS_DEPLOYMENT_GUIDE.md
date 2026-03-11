# AWS Deployment Guide - Splitwise Application

## Overview
We'll deploy your Splitwise application to AWS using:
- **EKS (Elastic Kubernetes Service)**: Managed Kubernetes cluster
- **RDS (Optional)**: Managed PostgreSQL database (or use PostgreSQL in K8s)
- **ECR (Optional)**: Private Docker registry (or continue using Docker Hub)
- **ALB (Application Load Balancer)**: Automatically created by Kubernetes Ingress
- **Route 53 (Optional)**: DNS for custom domain

## Prerequisites

### 1. AWS Account Setup
- AWS account with billing enabled
- IAM user with administrator access
- AWS CLI installed and configured

### 2. Required Tools
```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# eksctl (EKS cluster management tool)
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# kubectl (already installed)
# Verify: kubectl version --client

# helm (Kubernetes package manager)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### 3. Configure AWS CLI
```bash
aws configure
# Enter:
# AWS Access Key ID: [Your access key]
# AWS Secret Access Key: [Your secret key]
# Default region: us-east-1 (or your preferred region)
# Default output format: json
```

---

## Deployment Options

### Option A: Quick Start (Recommended for Learning)
- Use EKS for Kubernetes
- PostgreSQL in Kubernetes (same as local)
- Docker Hub for images (already set up)
- Cost: ~$75/month (EKS cluster)

### Option B: Production Grade
- Use EKS for Kubernetes
- RDS for PostgreSQL (managed database)
- ECR for private Docker images
- Cost: ~$150/month (EKS + RDS + data transfer)

**We'll start with Option A, then show how to upgrade to Option B**

---

## Step 1: Create EKS Cluster

### 1.1 Create Cluster Configuration
```bash
cd ~/Desktop/AWS/Devops/splitwise-devops-project
```

Create `eks-cluster.yaml`:
```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: splitwise-cluster
  region: us-east-1
  version: "1.28"

# Node groups (EC2 instances that run your containers)
nodeGroups:
  - name: splitwise-nodes
    instanceType: t3.medium  # 2 vCPU, 4GB RAM
    desiredCapacity: 2       # Start with 2 nodes
    minSize: 2
    maxSize: 4
    volumeSize: 20
    ssh:
      allow: false
    iam:
      withAddonPolicies:
        autoScaler: true
        albIngress: true
        ebs: true

# Enable CloudWatch logging
cloudWatch:
  clusterLogging:
    enableTypes: ["api", "audit", "authenticator"]
```

### 1.2 Create the Cluster
```bash
eksctl create cluster -f eks-cluster.yaml
```

**This takes 15-20 minutes.** It creates:
- VPC with public/private subnets
- EKS control plane
- 2 EC2 worker nodes (t3.medium)
- Security groups
- IAM roles

**Cost Breakdown:**
- EKS control plane: $0.10/hour = $73/month
- 2 x t3.medium nodes: $0.0416/hour each = $60/month
- **Total: ~$133/month**

### 1.3 Verify Cluster
```bash
# Check cluster status
eksctl get cluster

# Verify kubectl is connected
kubectl get nodes

# You should see 2 nodes in Ready state
```

---

## Step 2: Install AWS Load Balancer Controller

This allows Kubernetes Ingress to create AWS Application Load Balancers.

### 2.1 Create IAM Policy
```bash
curl -o iam-policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.0/docs/install/iam_policy.json

aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam-policy.json
```

### 2.2 Create IAM Service Account
```bash
eksctl create iamserviceaccount \
  --cluster=splitwise-cluster \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::<YOUR_ACCOUNT_ID>:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve

# Get your account ID:
aws sts get-caller-identity --query Account --output text
```

### 2.3 Install Controller with Helm
```bash
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=splitwise-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

### 2.4 Verify Installation
```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
```

---

## Step 3: Deploy Application to EKS

### 3.1 Update Ingress for AWS
We need to modify the ingress to work with AWS ALB instead of Nginx.

Create `k8s/ingress-aws.yaml`:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: splitwise-ingress
  namespace: splitwise
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}]'
    alb.ingress.kubernetes.io/healthcheck-path: /api/health
spec:
  ingressClassName: alb
  rules:
  - http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 5000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

### 3.2 Deploy Everything
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply secrets and config
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml

# Deploy database
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml

# Wait for database to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n splitwise --timeout=300s

# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# Deploy ingress (creates ALB)
kubectl apply -f k8s/ingress-aws.yaml
```

### 3.3 Get Application URL
```bash
# Wait for ALB to be created (takes 2-3 minutes)
kubectl get ingress -n splitwise -w

# Get the ALB URL
kubectl get ingress splitwise-ingress -n splitwise -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

You'll get a URL like: `k8s-splitwi-splitwis-abc123-1234567890.us-east-1.elb.amazonaws.com`

### 3.4 Test the Application
```bash
# Test backend health
curl http://<ALB-URL>/api/health

# Open in browser
# http://<ALB-URL>
```

---

## Step 4: Set Up Custom Domain (Optional)

### 4.1 Register Domain in Route 53
- Go to AWS Console → Route 53
- Register a domain (e.g., `splitwise-demo.com`) - costs $12/year

### 4.2 Create DNS Record
```bash
# Get ALB hostname
ALB_URL=$(kubectl get ingress splitwise-ingress -n splitwise -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# In Route 53 console:
# 1. Go to Hosted Zones → your domain
# 2. Create Record:
#    - Record name: www (or leave blank for root domain)
#    - Record type: A - IPv4 address
#    - Alias: Yes
#    - Route traffic to: Alias to Application Load Balancer
#    - Region: us-east-1
#    - Choose your ALB
```

### 4.3 Update Ingress with Domain
```yaml
# Update k8s/ingress-aws.yaml
spec:
  rules:
  - host: www.splitwise-demo.com  # Add this line
    http:
      paths:
      # ... rest stays the same
```

Apply:
```bash
kubectl apply -f k8s/ingress-aws.yaml
```

### 4.4 Add HTTPS (Optional but Recommended)
```bash
# Request SSL certificate in AWS Certificate Manager
aws acm request-certificate \
  --domain-name www.splitwise-demo.com \
  --validation-method DNS \
  --region us-east-1

# Follow email/DNS validation steps in ACM console

# Update ingress annotations:
# alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
# alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:xxx:certificate/xxx
# alb.ingress.kubernetes.io/ssl-redirect: '443'
```

---

## Step 5: Set Up CI/CD for AWS

### 5.1 Update GitHub Actions Workflow
Modify `.github/workflows/ci-cd.yml` to deploy to EKS:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install backend dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run backend tests
        run: |
          cd backend
          npm test
      
      - name: Build and push backend image
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          cd backend
          docker build -t ${{ secrets.DOCKER_USERNAME }}/splitwise-backend:${{ github.sha }} .
          docker tag ${{ secrets.DOCKER_USERNAME }}/splitwise-backend:${{ github.sha }} ${{ secrets.DOCKER_USERNAME }}/splitwise-backend:latest
          docker push ${{ secrets.DOCKER_USERNAME }}/splitwise-backend:${{ github.sha }}
          docker push ${{ secrets.DOCKER_USERNAME }}/splitwise-backend:latest
      
      - name: Build and push frontend image
        run: |
          cd frontend
          docker build -t ${{ secrets.DOCKER_USERNAME }}/splitwise-frontend:${{ github.sha }} .
          docker tag ${{ secrets.DOCKER_USERNAME }}/splitwise-frontend:${{ github.sha }} ${{ secrets.DOCKER_USERNAME }}/splitwise-frontend:latest
          docker push ${{ secrets.DOCKER_USERNAME }}/splitwise-frontend:${{ github.sha }}
          docker push ${{ secrets.DOCKER_USERNAME }}/splitwise-frontend:latest

  deploy-to-eks:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/master'
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig --name splitwise-cluster --region us-east-1
      
      - name: Deploy to EKS
        run: |
          kubectl set image deployment/backend backend=${{ secrets.DOCKER_USERNAME }}/splitwise-backend:${{ github.sha }} -n splitwise
          kubectl set image deployment/frontend frontend=${{ secrets.DOCKER_USERNAME }}/splitwise-frontend:${{ github.sha }} -n splitwise
          kubectl rollout status deployment/backend -n splitwise
          kubectl rollout status deployment/frontend -n splitwise
```

### 5.2 Add AWS Secrets to GitHub
Go to GitHub → Settings → Secrets and variables → Actions → New repository secret:
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

---

## Step 6: Monitoring and Logging

### 6.1 View Logs
```bash
# Backend logs
kubectl logs -f deployment/backend -n splitwise

# Frontend logs
kubectl logs -f deployment/frontend -n splitwise

# Database logs
kubectl logs -f deployment/postgres -n splitwise
```

### 6.2 Check Pod Status
```bash
kubectl get pods -n splitwise
kubectl describe pod <pod-name> -n splitwise
```

### 6.3 Set Up CloudWatch (Optional)
```bash
# Install CloudWatch agent
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluentd-quickstart.yaml
```

---

## Step 7: Scaling

### 7.1 Manual Scaling
```bash
# Scale backend to 5 replicas
kubectl scale deployment backend --replicas=5 -n splitwise

# Scale frontend to 3 replicas
kubectl scale deployment frontend --replicas=3 -n splitwise
```

### 7.2 Auto-Scaling (HPA)
```bash
# Install metrics server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Create HPA for backend
kubectl autoscale deployment backend --cpu-percent=70 --min=2 --max=10 -n splitwise

# Create HPA for frontend
kubectl autoscale deployment frontend --cpu-percent=70 --min=2 --max=10 -n splitwise
```

---

## Step 8: Upgrade to Production (Option B)

### 8.1 Use RDS for Database

#### Create RDS Instance
```bash
aws rds create-db-instance \
    --db-instance-identifier splitwise-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.4 \
    --master-username postgres \
    --master-user-password YourStrongPassword123! \
    --allocated-storage 20 \
    --vpc-security-group-ids sg-xxxxx \
    --db-subnet-group-name default \
    --backup-retention-period 7 \
    --publicly-accessible false
```

#### Update ConfigMap
```yaml
# k8s/configmap.yaml
data:
  POSTGRES_HOST: splitwise-db.xxxxx.us-east-1.rds.amazonaws.com
  POSTGRES_PORT: "5432"
  POSTGRES_DB: splitwise
  POSTGRES_USER: postgres
```

#### Remove PostgreSQL Deployment
```bash
kubectl delete deployment postgres -n splitwise
kubectl delete service postgres-service -n splitwise
kubectl delete pvc postgres-pvc -n splitwise
```

### 8.2 Use ECR for Private Images

#### Create ECR Repositories
```bash
aws ecr create-repository --repository-name splitwise-backend --region us-east-1
aws ecr create-repository --repository-name splitwise-frontend --region us-east-1
```

#### Push Images to ECR
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag nikhilbabhulkar/splitwise-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/splitwise-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/splitwise-backend:latest

docker tag nikhilbabhulkar/splitwise-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/splitwise-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/splitwise-frontend:latest
```

#### Update Deployments
```yaml
# k8s/backend-deployment.yaml
spec:
  template:
    spec:
      containers:
      - name: backend
        image: <account-id>.dkr.ecr.us-east-1.amazonaws.com/splitwise-backend:latest
```

---

## Cost Optimization Tips

### 1. Use Spot Instances for Worker Nodes
```yaml
# eks-cluster.yaml
nodeGroups:
  - name: splitwise-spot-nodes
    instancesDistribution:
      instanceTypes: ["t3.medium", "t3a.medium"]
      onDemandBaseCapacity: 0
      onDemandPercentageAboveBaseCapacity: 0
      spotInstancePools: 2
```
**Savings: 60-70% on EC2 costs**

### 2. Use Fargate for Serverless Containers
```bash
eksctl create fargateprofile \
    --cluster splitwise-cluster \
    --name splitwise-profile \
    --namespace splitwise
```
**Pay only for running pods, no idle EC2 costs**

### 3. Schedule Non-Production Environments
```bash
# Stop cluster at night (save ~50% on dev/test)
eksctl scale nodegroup --cluster=splitwise-cluster --name=splitwise-nodes --nodes=0

# Start in morning
eksctl scale nodegroup --cluster=splitwise-cluster --name=splitwise-nodes --nodes=2
```

---

## Cleanup (When Done Testing)

```bash
# Delete application
kubectl delete namespace splitwise

# Delete cluster (saves $133/month)
eksctl delete cluster --name splitwise-cluster

# Delete RDS (if created)
aws rds delete-db-instance --db-instance-identifier splitwise-db --skip-final-snapshot

# Delete ECR repositories
aws ecr delete-repository --repository-name splitwise-backend --force
aws ecr delete-repository --repository-name splitwise-frontend --force
```

---

## Troubleshooting

### Issue: Pods not starting
```bash
kubectl describe pod <pod-name> -n splitwise
kubectl logs <pod-name> -n splitwise
```

### Issue: Can't access application
```bash
# Check ingress
kubectl get ingress -n splitwise
kubectl describe ingress splitwise-ingress -n splitwise

# Check ALB in AWS Console
# EC2 → Load Balancers → Check health checks
```

### Issue: Database connection failed
```bash
# Check if postgres is running
kubectl get pods -n splitwise | grep postgres

# Check backend logs
kubectl logs deployment/backend -n splitwise | grep -i error
```

---

## Next Steps

1. Set up monitoring with CloudWatch or Prometheus
2. Implement backup strategy for database
3. Set up staging environment
4. Configure SSL/TLS certificates
5. Implement secrets management with AWS Secrets Manager
6. Set up disaster recovery plan

## Support Resources

- [EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
