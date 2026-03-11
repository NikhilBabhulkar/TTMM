# AWS Quick Start Guide

## Prerequisites (One-time Setup)

### 1. Install Required Tools
```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version

# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-1
# Default output format: json
```

### 2. Verify AWS Account
```bash
# Check your AWS account ID
aws sts get-caller-identity

# You should see your Account ID, UserId, and Arn
```

## Deploy to AWS (3 Simple Steps)

### Step 1: Create EKS Cluster (15-20 minutes)
```bash
cd ~/Desktop/AWS/Devops/splitwise-devops-project

# Make script executable
chmod +x scripts/aws-setup.sh

# Run setup (creates cluster + installs required components)
./scripts/aws-setup.sh
```

**What this does:**
- Creates EKS cluster with 2 worker nodes
- Installs AWS Load Balancer Controller
- Installs Metrics Server for autoscaling
- Configures kubectl to connect to cluster

**Cost:** ~$133/month while running

### Step 2: Deploy Application (5 minutes)
```bash
# Make script executable
chmod +x scripts/deploy-to-aws.sh

# Deploy application
./scripts/deploy-to-aws.sh
```

**What this does:**
- Creates namespace and applies secrets/config
- Deploys PostgreSQL database
- Deploys backend (2 replicas)
- Deploys frontend (2 replicas)
- Creates AWS Application Load Balancer
- Waits for everything to be ready

### Step 3: Access Your Application
```bash
# Get the Load Balancer URL
kubectl get ingress splitwise-ingress -n splitwise

# Copy the ADDRESS column (looks like: k8s-splitwi-xxx.us-east-1.elb.amazonaws.com)
# Open in browser: http://<ALB-URL>
```

## Verify Deployment

```bash
# Check all resources
kubectl get all -n splitwise

# Check pods are running
kubectl get pods -n splitwise

# Check backend health
ALB_URL=$(kubectl get ingress splitwise-ingress -n splitwise -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl http://$ALB_URL/api/health

# View backend logs
kubectl logs -f deployment/backend -n splitwise
```

## Common Operations

### View Logs
```bash
# Backend logs
kubectl logs -f deployment/backend -n splitwise

# Frontend logs
kubectl logs -f deployment/frontend -n splitwise

# Database logs
kubectl logs -f deployment/postgres -n splitwise

# Specific pod logs
kubectl logs <pod-name> -n splitwise
```

### Scale Application
```bash
# Scale backend to 5 replicas
kubectl scale deployment backend --replicas=5 -n splitwise

# Scale frontend to 3 replicas
kubectl scale deployment frontend --replicas=3 -n splitwise

# Check scaling status
kubectl get pods -n splitwise -w
```

### Update Application
```bash
# After pushing new images to Docker Hub

# Update backend
kubectl set image deployment/backend backend=nikhilbabhulkar/splitwise-backend:latest -n splitwise
kubectl rollout status deployment/backend -n splitwise

# Update frontend
kubectl set image deployment/frontend frontend=nikhilbabhulkar/splitwise-frontend:latest -n splitwise
kubectl rollout status deployment/frontend -n splitwise
```

### Rollback Deployment
```bash
# Rollback backend to previous version
kubectl rollout undo deployment/backend -n splitwise

# Rollback frontend to previous version
kubectl rollout undo deployment/frontend -n splitwise

# Check rollout history
kubectl rollout history deployment/backend -n splitwise
```

## Monitoring

### Check Cluster Status
```bash
# View nodes
kubectl get nodes

# View all namespaces
kubectl get namespaces

# View all resources in splitwise namespace
kubectl get all -n splitwise

# Describe a pod (for troubleshooting)
kubectl describe pod <pod-name> -n splitwise
```

### Check AWS Resources
```bash
# View EKS cluster
aws eks describe-cluster --name splitwise-cluster --region us-east-1

# View Load Balancers
aws elbv2 describe-load-balancers --region us-east-1

# View EC2 instances (worker nodes)
aws ec2 describe-instances --filters "Name=tag:eks:cluster-name,Values=splitwise-cluster" --region us-east-1
```

## Troubleshooting

### Pods Not Starting
```bash
# Check pod status
kubectl get pods -n splitwise

# Describe pod to see events
kubectl describe pod <pod-name> -n splitwise

# Check logs
kubectl logs <pod-name> -n splitwise

# Common issues:
# - Image pull errors: Check Docker Hub image exists
# - CrashLoopBackOff: Check application logs
# - Pending: Check node resources (kubectl describe nodes)
```

### Can't Access Application
```bash
# Check ingress status
kubectl get ingress -n splitwise
kubectl describe ingress splitwise-ingress -n splitwise

# Check if ALB is created
aws elbv2 describe-load-balancers --region us-east-1 | grep splitwise

# Check target groups health
# Go to AWS Console → EC2 → Target Groups → Check health status
```

### Database Connection Issues
```bash
# Check if postgres pod is running
kubectl get pods -n splitwise | grep postgres

# Check postgres logs
kubectl logs deployment/postgres -n splitwise

# Check backend can connect
kubectl exec -it deployment/backend -n splitwise -- env | grep POSTGRES

# Test connection from backend pod
kubectl exec -it deployment/backend -n splitwise -- sh
# Inside pod:
# nc -zv postgres-service 5432
```

## Cost Management

### Check Current Costs
```bash
# View running resources
kubectl get nodes  # Each node costs ~$30/month
kubectl get pods -n splitwise  # Check how many pods running

# EKS control plane: $73/month (fixed)
# Worker nodes: $30/month per t3.medium instance
# Load Balancer: ~$20/month
# Data transfer: Variable
```

### Stop Cluster (Save Money)
```bash
# Scale down to 0 nodes (saves ~$60/month, keeps cluster)
eksctl scale nodegroup --cluster=splitwise-cluster --name=splitwise-nodes --nodes=0 --region us-east-1

# Scale back up when needed
eksctl scale nodegroup --cluster=splitwise-cluster --name=splitwise-nodes --nodes=2 --region us-east-1
```

### Delete Everything (Stop All Charges)
```bash
# Delete application
kubectl delete namespace splitwise

# Delete cluster (stops all charges)
eksctl delete cluster --name splitwise-cluster --region us-east-1

# This takes 10-15 minutes and removes:
# - EKS cluster
# - Worker nodes
# - Load Balancers
# - VPC resources
```

## CI/CD Integration

### Set Up GitHub Actions for AWS

1. **Create AWS IAM User for GitHub Actions**
```bash
# Create IAM user
aws iam create-user --user-name github-actions-splitwise

# Attach policies
aws iam attach-user-policy --user-name github-actions-splitwise --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy
aws iam attach-user-policy --user-name github-actions-splitwise --policy-arn arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy

# Create access key
aws iam create-access-key --user-name github-actions-splitwise
# Save the AccessKeyId and SecretAccessKey
```

2. **Add Secrets to GitHub**
   - Go to GitHub → Repository → Settings → Secrets and variables → Actions
   - Add secrets:
     - `AWS_ACCESS_KEY_ID`: From previous step
     - `AWS_SECRET_ACCESS_KEY`: From previous step
     - `DOCKER_USERNAME`: nikhilbabhulkar
     - `DOCKER_PASSWORD`: Your Docker Hub password

3. **Push to GitHub**
```bash
git add .
git commit -m "Add AWS deployment configuration"
git push origin master
```

GitHub Actions will automatically:
- Build and test code
- Build Docker images
- Push to Docker Hub
- Deploy to EKS cluster

## Next Steps

1. **Set Up Custom Domain**
   - Register domain in Route 53
   - Create DNS record pointing to ALB
   - Add SSL certificate with ACM
   - Update ingress with HTTPS

2. **Set Up Monitoring**
   - Install Prometheus and Grafana
   - Set up CloudWatch dashboards
   - Configure alerts

3. **Implement Auto-Scaling**
   - Set up Horizontal Pod Autoscaler (HPA)
   - Configure Cluster Autoscaler
   - Set resource limits

4. **Enhance Security**
   - Use AWS Secrets Manager
   - Implement network policies
   - Set up pod security policies
   - Enable encryption at rest

5. **Backup Strategy**
   - Set up database backups
   - Configure disaster recovery
   - Test restore procedures

## Support

- **AWS Documentation**: https://docs.aws.amazon.com/eks/
- **Kubernetes Documentation**: https://kubernetes.io/docs/
- **eksctl Documentation**: https://eksctl.io/

## Useful Links

- AWS Console: https://console.aws.amazon.com/
- EKS Console: https://console.aws.amazon.com/eks/
- EC2 Console: https://console.aws.amazon.com/ec2/
- CloudWatch: https://console.aws.amazon.com/cloudwatch/
