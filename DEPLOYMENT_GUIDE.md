# Quick Deployment Guide

## 🚀 Fast Track Deployment

### Prerequisites
- Docker installed
- Docker Hub account
- Kubernetes cluster (Minikube/Cloud)
- kubectl configured

### Step 1: Update Configuration

Replace `YOUR_DOCKERHUB_USERNAME` with your actual username in:
```bash
# Update these files
k8s/backend-deployment.yaml (line 15)
k8s/frontend-deployment.yaml (line 15)
Jenkinsfile (line 6)
```

### Step 2: Build and Push Images

```bash
# Build and push to Docker Hub
./scripts/build-and-push.sh YOUR_DOCKERHUB_USERNAME

# Or manually
docker build -t YOUR_USERNAME/splitwise-backend:latest ./backend
docker build -t YOUR_USERNAME/splitwise-frontend:latest ./frontend
docker push YOUR_USERNAME/splitwise-backend:latest
docker push YOUR_USERNAME/splitwise-frontend:latest
```

### Step 3: Deploy to Kubernetes

```bash
# Quick deploy
./scripts/deploy.sh

# Or manually
kubectl apply -f k8s/
```

### Step 4: Access Application

```bash
# For Minikube
echo "$(minikube ip) splitwise.local" | sudo tee -a /etc/hosts

# Access at
http://splitwise.local
```

## 📋 Detailed Setup

See [CICD_SETUP.md](CICD_SETUP.md) for complete instructions including:
- GitHub Actions setup
- Jenkins configuration
- Kubernetes cluster setup
- Monitoring and troubleshooting

## 🧪 Local Testing

```bash
# Test with Docker Compose
docker-compose up --build

# Access at
Frontend: http://localhost
Backend: http://localhost:5000
```

## 🔧 Useful Commands

```bash
# Check deployment
kubectl get all -n splitwise

# View logs
kubectl logs -f deployment/backend -n splitwise

# Scale application
kubectl scale deployment backend --replicas=3 -n splitwise

# Cleanup
./scripts/cleanup.sh
```

## 📚 Documentation

- [Complete CI/CD Setup](CICD_SETUP.md)
- [Kubernetes Manifests](k8s/README.md)
- [Architecture](ARCHITECTURE.md)
- [Testing Guide](TESTING.md)
