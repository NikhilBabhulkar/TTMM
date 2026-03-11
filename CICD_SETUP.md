# CI/CD Pipeline Setup Guide

This guide will help you set up a complete CI/CD pipeline for the Splitwise application using GitHub Actions, Jenkins, Docker, and Kubernetes.

## 📋 Prerequisites

- Docker Hub account ✅ (You have this)
- GitHub repository ✅ (Already set up)
- Kubernetes cluster (we'll set this up)
- Jenkins server (we'll set this up)

## 🏗️ Architecture Overview

```
GitHub → GitHub Actions (CI) → Docker Hub → Jenkins (CD) → Kubernetes
```

1. **GitHub Actions**: Runs tests and builds Docker images
2. **Docker Hub**: Stores container images
3. **Jenkins**: Orchestrates deployment to Kubernetes
4. **Kubernetes**: Runs and manages containers

---

## Part 1: Docker Setup

### 1.1 Test Locally with Docker Compose

```bash
cd splitwise-devops-project

# Build and run all services
docker-compose up --build

# Access the application
# Frontend: http://localhost
# Backend: http://localhost:5000
```

### 1.2 Configure Docker Hub

Update these files with your Docker Hub username:
- `k8s/backend-deployment.yaml` (line 15)
- `k8s/frontend-deployment.yaml` (line 15)
- `Jenkinsfile` (line 6)

Replace `YOUR_DOCKERHUB_USERNAME` with your actual username.

---

## Part 2: GitHub Actions Setup

### 2.1 Add GitHub Secrets

Go to your repository: https://github.com/NikhilBabhulkar/TTMM

1. Click **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password/token

### 2.2 Test GitHub Actions

```bash
# Push changes to trigger the workflow
git add .
git commit -m "Add CI/CD pipeline"
git push origin master
```

Check the Actions tab in GitHub to see the workflow running.

---

## Part 3: Kubernetes Setup

### Option A: Local Kubernetes (Minikube)


#### Install Minikube

```bash
# For Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start Minikube
minikube start --driver=docker --cpus=4 --memory=8192

# Enable Ingress addon
minikube addons enable ingress

# Verify installation
kubectl get nodes
```

### Option B: Cloud Kubernetes (AWS EKS, GKE, or AKS)

Choose one based on your preference:

#### AWS EKS (Recommended for AWS users)
```bash
# Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Create cluster
eksctl create cluster --name splitwise-cluster --region us-east-1 --nodes 2
```

#### Google GKE
```bash
# Install gcloud CLI first
gcloud container clusters create splitwise-cluster --num-nodes=2 --zone=us-central1-a
gcloud container clusters get-credentials splitwise-cluster --zone=us-central1-a
```

### 3.1 Deploy to Kubernetes

```bash
cd splitwise-devops-project

# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets (IMPORTANT: Change passwords in production!)
kubectl apply -f k8s/secrets.yaml

# Create configmap
kubectl apply -f k8s/configmap.yaml

# Deploy database
kubectl apply -f k8s/postgres-deployment.yaml

# Wait for database to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n splitwise --timeout=120s

# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml

# Deploy ingress
kubectl apply -f k8s/ingress.yaml

# Check deployment status
kubectl get all -n splitwise
```

### 3.2 Access the Application

#### For Minikube:
```bash
# Get Minikube IP
minikube ip

# Add to /etc/hosts
echo "$(minikube ip) splitwise.local" | sudo tee -a /etc/hosts

# Access application
# Frontend: http://splitwise.local
# Backend: http://splitwise.local/api
```

#### For Cloud Kubernetes:
```bash
# Get LoadBalancer IP
kubectl get svc frontend-service -n splitwise

# Access using the EXTERNAL-IP shown
```

---

## Part 4: Jenkins Setup

### 4.1 Install Jenkins

#### Option A: Docker (Easiest)
```bash
docker run -d -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --name jenkins \
  jenkins/jenkins:lts
```

#### Option B: Linux Installation
```bash
# Add Jenkins repository
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'

# Install Jenkins
sudo apt update
sudo apt install jenkins -y

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins
```

### 4.2 Initial Jenkins Setup

1. Access Jenkins: http://localhost:8080
2. Get initial password:
```bash
# For Docker
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# For Linux
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```
3. Install suggested plugins
4. Create admin user

### 4.3 Install Required Jenkins Plugins

Go to **Manage Jenkins** → **Manage Plugins** → **Available**

Install these plugins:
- Docker Pipeline
- Kubernetes CLI
- Git
- Pipeline
- Credentials Binding
- Email Extension

### 4.4 Configure Jenkins Credentials

Go to **Manage Jenkins** → **Manage Credentials** → **Global**

Add these credentials:

1. **Docker Hub Credentials**
   - Kind: Username with password
   - ID: `dockerhub-credentials`
   - Username: Your Docker Hub username
   - Password: Your Docker Hub password

2. **Docker Hub Username** (for environment variable)
   - Kind: Secret text
   - ID: `dockerhub-username`
   - Secret: Your Docker Hub username

3. **Kubeconfig**
   - Kind: Secret file
   - ID: `kubeconfig`
   - File: Upload your `~/.kube/config` file

### 4.5 Create Jenkins Pipeline

1. Click **New Item**
2. Enter name: `Splitwise-CICD`
3. Select **Pipeline**
4. Under **Pipeline** section:
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: https://github.com/NikhilBabhulkar/TTMM.git
   - Branch: */master
   - Script Path: Jenkinsfile
5. Click **Save**

### 4.6 Run the Pipeline

1. Click **Build Now**
2. Watch the pipeline execute
3. Check Kubernetes for deployed pods

---

## Part 5: Complete Workflow

### How It Works

1. **Developer pushes code** to GitHub
2. **GitHub Actions triggers**:
   - Runs backend tests
   - Runs frontend tests
   - Builds Docker images
   - Pushes images to Docker Hub
3. **Jenkins pipeline triggers** (manually or via webhook):
   - Pulls latest code
   - Builds new Docker images
   - Pushes to Docker Hub
   - Deploys to Kubernetes
   - Verifies deployment
4. **Kubernetes** runs the application with:
   - Auto-scaling
   - Health checks
   - Rolling updates
   - Load balancing

### Trigger Jenkins from GitHub (Optional)

1. In Jenkins, install **GitHub Integration** plugin
2. In your GitHub repo:
   - Go to Settings → Webhooks
   - Add webhook: `http://YOUR_JENKINS_URL:8080/github-webhook/`
   - Content type: application/json
   - Events: Just the push event
3. Now Jenkins will auto-trigger on push!

---

## Part 6: Verification & Testing

### 6.1 Check All Components

```bash
# Check GitHub Actions
# Visit: https://github.com/NikhilBabhulkar/TTMM/actions

# Check Docker Hub
# Visit: https://hub.docker.com/u/YOUR_USERNAME

# Check Kubernetes
kubectl get all -n splitwise
kubectl get pods -n splitwise
kubectl logs -f deployment/backend -n splitwise
kubectl logs -f deployment/frontend -n splitwise

# Check Jenkins
# Visit: http://localhost:8080
```

### 6.2 Test the Application

```bash
# Get application URL
kubectl get ingress -n splitwise

# Test backend health
curl http://splitwise.local/api/health

# Test frontend
curl http://splitwise.local
```

---

## Part 7: Monitoring & Maintenance

### View Logs

```bash
# Backend logs
kubectl logs -f deployment/backend -n splitwise

# Frontend logs
kubectl logs -f deployment/frontend -n splitwise

# Database logs
kubectl logs -f deployment/postgres -n splitwise
```

### Scale Applications

```bash
# Scale backend
kubectl scale deployment backend --replicas=3 -n splitwise

# Scale frontend
kubectl scale deployment frontend --replicas=3 -n splitwise
```

### Update Application

```bash
# After code changes, Jenkins will:
# 1. Build new images
# 2. Push to Docker Hub
# 3. Update Kubernetes deployments
# 4. Perform rolling update (zero downtime)
```

### Rollback

```bash
# Rollback backend
kubectl rollout undo deployment/backend -n splitwise

# Rollback frontend
kubectl rollout undo deployment/frontend -n splitwise
```

---

## 🎯 Quick Start Checklist

- [ ] Update Docker Hub username in k8s files and Jenkinsfile
- [ ] Add GitHub secrets (DOCKER_USERNAME, DOCKER_PASSWORD)
- [ ] Install Kubernetes (Minikube or Cloud)
- [ ] Deploy application to Kubernetes
- [ ] Install and configure Jenkins
- [ ] Add Jenkins credentials
- [ ] Create Jenkins pipeline
- [ ] Test the complete workflow
- [ ] Set up GitHub webhook (optional)

---

## 🚨 Troubleshooting

### GitHub Actions failing?
- Check secrets are set correctly
- Verify Docker Hub credentials

### Jenkins can't connect to Kubernetes?
- Verify kubeconfig file is uploaded
- Check Jenkins has kubectl installed

### Pods not starting?
```bash
kubectl describe pod POD_NAME -n splitwise
kubectl logs POD_NAME -n splitwise
```

### Can't access application?
- Check ingress: `kubectl get ingress -n splitwise`
- Verify services: `kubectl get svc -n splitwise`
- For Minikube: Ensure /etc/hosts is configured

---

## 📚 Next Steps

1. Set up monitoring (Prometheus + Grafana)
2. Configure auto-scaling (HPA)
3. Add SSL/TLS certificates
4. Set up backup for database
5. Implement blue-green deployments
6. Add security scanning to pipeline

---

## 🔗 Useful Commands

```bash
# Kubernetes
kubectl get all -n splitwise
kubectl describe pod POD_NAME -n splitwise
kubectl logs -f POD_NAME -n splitwise
kubectl exec -it POD_NAME -n splitwise -- /bin/sh

# Docker
docker ps
docker logs CONTAINER_NAME
docker-compose up --build
docker-compose down

# Jenkins
# Access: http://localhost:8080
# Logs: docker logs jenkins

# Minikube
minikube status
minikube dashboard
minikube service list
```

---

Good luck with your CI/CD pipeline! 🚀
