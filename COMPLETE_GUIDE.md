# Complete DevOps Guide - From Zero to Production

## 📚 Table of Contents

1. [Understanding the Basics](#understanding-the-basics)
2. [What We Built](#what-we-built)
3. [Local Development](#local-development)
4. [AWS Production Deployment](#aws-production-deployment)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Understanding the Basics

### What is DevOps?

DevOps combines Development (Dev) and Operations (Ops) to:
- Automate software delivery
- Improve deployment frequency
- Achieve faster time to market
- Lower failure rate of new releases
- Shorten lead time between fixes

### The Tools We Use

| Tool | Purpose | Analogy |
|------|---------|---------|
| **Docker** | Package applications | Like a shipping container - same everywhere |
| **Kubernetes** | Orchestrate containers | Like a shipping port - manages many containers |
| **GitHub Actions** | Automate testing & building | Like a factory assembly line |
| **Jenkins** | Automate deployment | Like a delivery truck |
| **AWS EKS** | Managed Kubernetes | Like renting a warehouse instead of building one |

---

## What We Built

### Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              AWS Load Balancer (ALB)                     │
│  Routes: /api/* → Backend, /* → Frontend                │
└────────────┬────────────────────────┬───────────────────┘
             │                        │
             ▼                        ▼
┌────────────────────────┐  ┌────────────────────────┐
│   Frontend Service     │  │   Backend Service      │
│   (Load Balancer)      │  │   (Load Balancer)      │
└────────┬───────────────┘  └────────┬───────────────┘
         │                           │
    ┌────┴────┐                 ┌────┴────┐
    ▼         ▼                 ▼         ▼
┌────────┐ ┌────────┐      ┌────────┐ ┌────────┐
│Frontend│ │Frontend│      │Backend │ │Backend │
│ Pod 1  │ │ Pod 2  │      │ Pod 1  │ │ Pod 2  │
│(Nginx) │ │(Nginx) │      │(Node.js│ │(Node.js│
└────────┘ └────────┘      └────┬───┘ └────┬───┘
                                 │          │
                                 └────┬─────┘
                                      ▼
                            ┌──────────────────┐
                            │ PostgreSQL Pod   │
                            │ (Database)       │
                            └──────────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │ Persistent Volume│
                            │ (Actual Data)    │
                            └──────────────────┘
```

### The 3 Docker Images

#### 1. Backend Image (`nikhilbabhulkar/splitwise-backend:latest`)
**Contains:**
- Node.js runtime
- Express.js server
- API endpoints
- Database connection logic
- Business logic

**Dockerfile Location:** `backend/Dockerfile`

**What it does:**
- Receives API requests from frontend
- Processes business logic (create expense, split bills, etc.)
- Talks to PostgreSQL database
- Returns JSON responses

#### 2. Frontend Image (`nikhilbabhulkar/splitwise-frontend:latest`)
**Contains:**
- React application (built/compiled)
- Nginx web server
- Static files (HTML, CSS, JS)

**Dockerfile Location:** `frontend/Dockerfile`

**What it does:**
- Serves the React application to users
- Handles routing (different pages)
- Makes API calls to backend
- Displays UI

#### 3. Database Image (`postgres:15-alpine`)
**Contains:**
- PostgreSQL database server
- Database engine

**No custom Dockerfile** - we use the official image

**What it does:**
- Stores all application data (users, groups, expenses)
- Handles SQL queries from backend
- Persists data to disk

### How They Work Together

1. **User visits website** → Nginx serves React app (Frontend)
2. **User creates expense** → React sends API request to Backend
3. **Backend processes** → Validates data, calculates splits
4. **Backend saves** → Writes to PostgreSQL database
5. **Backend responds** → Sends success/failure to Frontend
6. **Frontend updates** → Shows new expense to user

---

## Local Development

### Option 1: Docker Compose (Simplest)

```bash
# Start everything
docker-compose up -d

# Access application
# Frontend: http://localhost
# Backend: http://localhost:5000/api
# Database: localhost:5432

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

**What Docker Compose does:**
- Starts 3 containers (postgres, backend, frontend)
- Creates network so they can talk
- Maps ports to your localhost
- Manages startup order

### Option 2: Minikube (Local Kubernetes)

```bash
# Start Minikube
minikube start --driver=docker --cpus=2 --memory=4096

# Enable ingress
minikube addons enable ingress

# Deploy application
./scripts/deploy.sh

# Add to /etc/hosts
echo "$(minikube ip) splitwise.local" | sudo tee -a /etc/hosts

# Access application
# http://splitwise.local

# Stop Minikube
minikube stop
```

**What Minikube does:**
- Creates a single-node Kubernetes cluster on your laptop
- Simulates production environment
- Good for testing Kubernetes configs

---

## AWS Production Deployment

### Why AWS?

**Local (Minikube) vs AWS (EKS):**

| Aspect | Minikube | AWS EKS |
|--------|----------|---------|
| **Availability** | Only when your laptop is on | 24/7 |
| **Scalability** | Limited by laptop resources | Unlimited |
| **Reliability** | Single point of failure | Multiple availability zones |
| **Access** | Only you | Anyone on internet |
| **Cost** | Free | ~$133/month |
| **Use Case** | Development/Testing | Production |

### AWS Components

#### 1. EKS (Elastic Kubernetes Service)
**What it is:** Managed Kubernetes cluster

**What it does:**
- Runs the Kubernetes control plane (brain)
- Manages worker nodes (EC2 instances)
- Handles upgrades and patches
- Provides high availability

**Cost:** $73/month (control plane) + $30/month per worker node

#### 2. EC2 Worker Nodes
**What they are:** Virtual machines that run your containers

**What they do:**
- Run your Docker containers (pods)
- Provide CPU, memory, storage
- Can scale up/down based on load

**Our setup:** 2 x t3.medium (2 vCPU, 4GB RAM each)

#### 3. Application Load Balancer (ALB)
**What it is:** AWS load balancer

**What it does:**
- Receives all incoming traffic
- Routes /api/* to backend
- Routes /* to frontend
- Distributes load across multiple pods
- Provides health checks

**Created automatically** by Kubernetes Ingress

#### 4. EBS Volumes
**What they are:** Persistent storage disks

**What they do:**
- Store database data
- Survive pod restarts
- Can be backed up

**Our setup:** 5GB for PostgreSQL data

### Step-by-Step AWS Deployment

#### Prerequisites
```bash
# 1. Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 2. Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1)

# 3. Verify
aws sts get-caller-identity
```

#### Step 1: Create EKS Cluster (One-time, 15-20 minutes)
```bash
cd ~/Desktop/AWS/Devops/splitwise-devops-project

# Make script executable
chmod +x scripts/aws-setup.sh

# Run setup
./scripts/aws-setup.sh
```

**What happens:**
1. Creates VPC (virtual network)
2. Creates EKS cluster
3. Launches 2 EC2 worker nodes
4. Installs AWS Load Balancer Controller
5. Installs Metrics Server
6. Configures kubectl

**You only do this once!**

#### Step 2: Deploy Application (5 minutes)
```bash
# Make script executable
chmod +x scripts/deploy-to-aws.sh

# Deploy
./scripts/deploy-to-aws.sh
```

**What happens:**
1. Creates namespace "splitwise"
2. Applies secrets (passwords, JWT secret)
3. Applies config (database host, port, etc.)
4. Deploys PostgreSQL (1 pod + persistent volume)
5. Deploys Backend (2 pods)
6. Deploys Frontend (2 pods)
7. Creates Ingress (triggers ALB creation)
8. Waits for everything to be ready

#### Step 3: Access Application
```bash
# Get Load Balancer URL
kubectl get ingress splitwise-ingress -n splitwise

# Copy the ADDRESS (e.g., k8s-splitwi-xxx.us-east-1.elb.amazonaws.com)
# Open in browser: http://<ALB-URL>
```

### Understanding the Deployment

#### What's Running?

```bash
kubectl get all -n splitwise
```

**Output explanation:**
```
NAME                            READY   STATUS    RESTARTS   AGE
pod/backend-xxx-yyy             1/1     Running   0          5m
pod/backend-xxx-zzz             1/1     Running   0          5m
pod/frontend-xxx-yyy            1/1     Running   0          5m
pod/frontend-xxx-zzz            1/1     Running   0          5m
pod/postgres-xxx-yyy            1/1     Running   0          5m
```

- **5 pods total:** 2 backend, 2 frontend, 1 database
- **READY 1/1:** Container is running
- **STATUS Running:** Everything is healthy
- **RESTARTS 0:** No crashes

```
NAME                       TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)
service/backend-service    ClusterIP      10.100.1.1       <none>        5000/TCP
service/frontend-service   ClusterIP      10.100.1.2       <none>        80/TCP
service/postgres-service   ClusterIP      10.100.1.3       <none>        5432/TCP
```

- **Services:** Stable network endpoints
- **ClusterIP:** Internal only (not exposed to internet)
- **backend-service:5000:** Backend pods accessible at this address
- **postgres-service:5432:** Database accessible at this address

```
NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/backend    2/2     2            2           5m
deployment.apps/frontend   2/2     2            2           5m
deployment.apps/postgres   1/1     1            1           5m
```

- **Deployments:** Manage pods
- **READY 2/2:** 2 pods desired, 2 pods running
- **UP-TO-DATE:** All pods running latest version
- **AVAILABLE:** All pods ready to serve traffic

#### How Traffic Flows

```
User Browser
    ↓
http://k8s-splitwi-xxx.us-east-1.elb.amazonaws.com/api/users
    ↓
AWS Application Load Balancer (ALB)
    ↓ (routes /api/* to backend-service)
backend-service:5000
    ↓ (load balances between 2 pods)
backend-xxx-yyy OR backend-xxx-zzz
    ↓ (connects to database)
postgres-service:5432
    ↓
postgres-xxx-yyy
    ↓
Persistent Volume (actual data on disk)
```

---

## CI/CD Pipeline

### What is CI/CD?

**CI (Continuous Integration):**
- Automatically test code when you push to GitHub
- Build Docker images
- Catch bugs early

**CD (Continuous Deployment):**
- Automatically deploy to production
- Zero downtime updates
- Rollback if something breaks

### Our Pipeline

```
Developer pushes code to GitHub
    ↓
GitHub Actions triggered
    ↓
┌─────────────────────────────────┐
│  Job 1: Test Backend            │
│  - Install dependencies         │
│  - Run unit tests               │
│  - Check for errors             │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│  Job 2: Test Frontend           │
│  - Install dependencies         │
│  - Build React app              │
│  - Check for errors             │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│  Job 3: Build & Push Images     │
│  - Build backend Docker image   │
│  - Build frontend Docker image  │
│  - Push to Docker Hub           │
│  - Tag with commit SHA          │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│  Job 4: Deploy to AWS EKS       │
│  - Connect to EKS cluster       │
│  - Update backend deployment    │
│  - Update frontend deployment   │
│  - Wait for rollout             │
│  - Verify health                │
└─────────────────────────────────┘
    ↓
Application updated in production!
```

### Setting Up CI/CD

#### 1. GitHub Secrets (One-time)

Go to GitHub → Repository → Settings → Secrets and variables → Actions

Add these secrets:
- `DOCKER_USERNAME`: nikhilbabhulkar
- `DOCKER_PASSWORD`: Your Docker Hub password
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

#### 2. How It Works

**File:** `.github/workflows/ci-cd.yml`

**Triggers:**
- Push to master/main branch
- Pull request to master/main

**What happens:**
1. **On every push/PR:** Run tests
2. **On push to master:** Run tests + build images + deploy to AWS
3. **On PR:** Only run tests (don't deploy)

#### 3. Monitoring Pipeline

```bash
# View workflow runs
# Go to GitHub → Actions tab

# Check deployment status
kubectl rollout status deployment/backend -n splitwise
kubectl rollout status deployment/frontend -n splitwise

# View recent deployments
kubectl rollout history deployment/backend -n splitwise
```

#### 4. Rolling Back

```bash
# Rollback backend to previous version
kubectl rollout undo deployment/backend -n splitwise

# Rollback frontend to previous version
kubectl rollout undo deployment/frontend -n splitwise

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=2 -n splitwise
```

---

## Monitoring & Maintenance

### Daily Operations

#### Check Application Health
```bash
# Get ALB URL
ALB_URL=$(kubectl get ingress splitwise-ingress -n splitwise -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Test backend
curl http://$ALB_URL/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

#### View Logs
```bash
# Backend logs (live)
kubectl logs -f deployment/backend -n splitwise

# Frontend logs (live)
kubectl logs -f deployment/frontend -n splitwise

# Database logs (live)
kubectl logs -f deployment/postgres -n splitwise

# Last 100 lines
kubectl logs deployment/backend -n splitwise --tail=100

# Logs from specific pod
kubectl logs pod/backend-xxx-yyy -n splitwise
```

#### Check Resource Usage
```bash
# Node resources
kubectl top nodes

# Pod resources
kubectl top pods -n splitwise

# Describe node (detailed info)
kubectl describe node <node-name>
```

### Scaling

#### Manual Scaling
```bash
# Scale backend to 5 replicas
kubectl scale deployment backend --replicas=5 -n splitwise

# Scale frontend to 3 replicas
kubectl scale deployment frontend --replicas=3 -n splitwise

# Verify
kubectl get pods -n splitwise
```

#### Auto-Scaling (HPA)
```bash
# Create Horizontal Pod Autoscaler
kubectl autoscale deployment backend \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n splitwise

# Check HPA status
kubectl get hpa -n splitwise

# Describe HPA
kubectl describe hpa backend -n splitwise
```

**What HPA does:**
- Monitors CPU usage
- If CPU > 70%, adds more pods
- If CPU < 70%, removes pods
- Keeps between 2-10 pods

### Troubleshooting

#### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n splitwise

# If status is "Pending", "CrashLoopBackOff", "Error":

# 1. Describe pod (shows events)
kubectl describe pod <pod-name> -n splitwise

# 2. Check logs
kubectl logs <pod-name> -n splitwise

# 3. Check previous logs (if pod restarted)
kubectl logs <pod-name> -n splitwise --previous

# Common issues:
# - ImagePullBackOff: Image doesn't exist on Docker Hub
# - CrashLoopBackOff: Application is crashing (check logs)
# - Pending: Not enough resources (check node capacity)
```

#### Can't Access Application

```bash
# 1. Check ingress
kubectl get ingress -n splitwise
kubectl describe ingress splitwise-ingress -n splitwise

# 2. Check if ALB exists
aws elbv2 describe-load-balancers --region us-east-1 | grep splitwise

# 3. Check target group health
# Go to AWS Console → EC2 → Target Groups
# Find splitwise target groups
# Check "Targets" tab - should show "healthy"

# 4. Check security groups
# ALB security group should allow inbound port 80
```

#### Database Issues

```bash
# Check if postgres is running
kubectl get pods -n splitwise | grep postgres

# Check postgres logs
kubectl logs deployment/postgres -n splitwise

# Connect to postgres pod
kubectl exec -it deployment/postgres -n splitwise -- psql -U postgres -d splitwise

# Inside postgres:
# \dt  -- list tables
# \q   -- quit

# Check backend can connect
kubectl exec -it deployment/backend -n splitwise -- sh
# Inside pod:
# nc -zv postgres-service 5432  -- test connection
# env | grep POSTGRES  -- check environment variables
```

### Cost Management

#### Current Costs
```
EKS Control Plane:     $73/month  (fixed)
2 x t3.medium nodes:   $60/month  ($30 each)
Application Load Balancer: $20/month
Data Transfer:         ~$10/month
─────────────────────────────────
Total:                 ~$163/month
```

#### Reduce Costs

**Option 1: Use Spot Instances (60-70% cheaper)**
```yaml
# Update eks-cluster.yaml
nodeGroups:
  - name: splitwise-spot-nodes
    instancesDistribution:
      onDemandBaseCapacity: 0
      onDemandPercentageAboveBaseCapacity: 0
      spotInstancePools: 2
```

**Option 2: Scale Down When Not Needed**
```bash
# Stop worker nodes (keeps cluster, saves $60/month)
eksctl scale nodegroup --cluster=splitwise-cluster --name=splitwise-nodes --nodes=0

# Start again when needed
eksctl scale nodegroup --cluster=splitwise-cluster --name=splitwise-nodes --nodes=2
```

**Option 3: Use Smaller Instances**
```yaml
# Use t3.small instead of t3.medium (saves $30/month)
instanceType: t3.small  # 2 vCPU, 2GB RAM
```

#### Delete Everything
```bash
# Delete application (keeps cluster)
kubectl delete namespace splitwise

# Delete cluster (stops all charges)
eksctl delete cluster --name splitwise-cluster --region us-east-1
```

---

## Summary

### What You've Learned

1. **Docker:** Package applications into containers
2. **Kubernetes:** Orchestrate containers at scale
3. **AWS EKS:** Run Kubernetes in the cloud
4. **CI/CD:** Automate testing and deployment
5. **Monitoring:** Keep applications healthy
6. **Troubleshooting:** Fix common issues

### Key Files

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Build backend image |
| `frontend/Dockerfile` | Build frontend image |
| `docker-compose.yml` | Local development |
| `k8s/*.yaml` | Kubernetes manifests |
| `eks-cluster.yaml` | EKS cluster configuration |
| `.github/workflows/ci-cd.yml` | CI/CD pipeline |
| `scripts/aws-setup.sh` | Create EKS cluster |
| `scripts/deploy-to-aws.sh` | Deploy application |

### Quick Reference

```bash
# Local Development
docker-compose up -d
minikube start && ./scripts/deploy.sh

# AWS Deployment
./scripts/aws-setup.sh        # One-time
./scripts/deploy-to-aws.sh    # Deploy app

# Monitoring
kubectl get all -n splitwise
kubectl logs -f deployment/backend -n splitwise
kubectl top pods -n splitwise

# Scaling
kubectl scale deployment backend --replicas=5 -n splitwise

# Troubleshooting
kubectl describe pod <pod-name> -n splitwise
kubectl logs <pod-name> -n splitwise

# Cleanup
kubectl delete namespace splitwise
eksctl delete cluster --name splitwise-cluster
```

### Next Steps

1. ✅ Understand Docker and Kubernetes
2. ✅ Deploy to AWS EKS
3. ✅ Set up CI/CD pipeline
4. 🔲 Add custom domain with HTTPS
5. 🔲 Set up monitoring (Prometheus/Grafana)
6. 🔲 Implement auto-scaling
7. 🔲 Add database backups
8. 🔲 Set up staging environment

---

## Additional Resources

- **Learning Guide:** `LEARNING_GUIDE.md` - Deep dive into concepts
- **AWS Guide:** `AWS_DEPLOYMENT_GUIDE.md` - Detailed AWS instructions
- **Quick Start:** `AWS_QUICK_START.md` - Fast AWS deployment
- **Docker Documentation:** https://docs.docker.com/
- **Kubernetes Documentation:** https://kubernetes.io/docs/
- **AWS EKS Documentation:** https://docs.aws.amazon.com/eks/

---

**Questions? Issues?**
- Check logs: `kubectl logs -f deployment/backend -n splitwise`
- Describe resources: `kubectl describe pod <pod-name> -n splitwise`
- Review documentation in this repository
