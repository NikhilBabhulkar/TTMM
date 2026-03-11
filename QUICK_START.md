# 🚀 Quick Start Guide

## What You Have Now

Your Splitwise application now has a complete CI/CD pipeline! Here's what's been set up:

### ✅ Completed
- **Dockerfiles** for backend and frontend
- **Docker Compose** for local testing
- **Kubernetes manifests** for production deployment
- **GitHub Actions** workflow for automated CI
- **Jenkinsfile** for automated CD
- **Deployment scripts** for easy deployment

## 📋 What You Need to Do

### 1. Set Up GitHub Actions (5 minutes)

1. Go to your repository: https://github.com/NikhilBabhulkar/TTMM
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password

That's it! GitHub Actions will now automatically:
- Run tests on every push
- Build Docker images
- Push images to Docker Hub

### 2. Update Docker Hub Username (2 minutes)

Replace `YOUR_DOCKERHUB_USERNAME` in these files with your actual username:

```bash
# Edit these 3 files
k8s/backend-deployment.yaml (line 15)
k8s/frontend-deployment.yaml (line 15)
Jenkinsfile (line 6)
```

### 3. Choose Your Deployment Path

#### Option A: Local Testing (Easiest - 5 minutes)

```bash
# Test everything locally with Docker Compose
docker-compose up --build

# Access at:
# Frontend: http://localhost
# Backend: http://localhost:5000
```

#### Option B: Kubernetes Deployment (15 minutes)

**Install Minikube (if you don't have Kubernetes):**
```bash
# Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start Minikube
minikube start --driver=docker --cpus=4 --memory=8192
minikube addons enable ingress
```

**Deploy to Kubernetes:**
```bash
# Build and push images
./scripts/build-and-push.sh YOUR_DOCKERHUB_USERNAME

# Deploy to Kubernetes
./scripts/deploy.sh

# Access application
echo "$(minikube ip) splitwise.local" | sudo tee -a /etc/hosts
# Visit: http://splitwise.local
```

#### Option C: Jenkins Setup (30 minutes)

See [CICD_SETUP.md](CICD_SETUP.md) Part 4 for complete Jenkins setup instructions.

## 🎯 Recommended Learning Path

### Day 1: Local Testing
- Run with Docker Compose
- Understand how containers work
- Test the application

### Day 2: Kubernetes Basics
- Install Minikube
- Deploy to local Kubernetes
- Learn kubectl commands

### Day 3: CI/CD Pipeline
- Set up GitHub Actions
- Watch automated builds
- Understand the workflow

### Day 4: Jenkins
- Install Jenkins
- Configure credentials
- Run deployment pipeline

### Day 5: Cloud Deployment
- Choose cloud provider (AWS/GCP)
- Deploy to cloud Kubernetes
- Set up monitoring

## 📚 Documentation

- **[CICD_SETUP.md](CICD_SETUP.md)** - Complete step-by-step guide
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Quick deployment reference
- **[k8s/README.md](k8s/README.md)** - Kubernetes manifests explained

## 🆘 Need Help?

### Common Issues

**Docker not installed?**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

**Can't push to Docker Hub?**
```bash
# Login first
docker login
```

**Kubernetes pods not starting?**
```bash
# Check status
kubectl get pods -n splitwise
kubectl describe pod POD_NAME -n splitwise
kubectl logs POD_NAME -n splitwise
```

## 🎉 Next Steps

Once you have the basic pipeline working:

1. **Add monitoring** - Prometheus + Grafana
2. **Set up alerts** - Get notified of issues
3. **Implement auto-scaling** - Handle traffic spikes
4. **Add SSL/TLS** - Secure your application
5. **Deploy to cloud** - AWS EKS or Google GKE

## 💡 Tips

- Start with Docker Compose to understand the application
- Move to Kubernetes when comfortable with containers
- Set up GitHub Actions first (easiest)
- Jenkins is optional but great for learning
- Don't rush - understand each component

---

**You're all set! Start with Docker Compose and work your way up.** 🚀
