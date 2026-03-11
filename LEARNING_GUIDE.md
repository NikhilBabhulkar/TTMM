# Complete DevOps Learning Guide - Docker to Kubernetes

## Part 1: Understanding Docker (What We Built)

### What is Docker?
Docker packages your application and all its dependencies into a "container" - think of it as a lightweight virtual machine that runs the same way everywhere.

### The 3 Dockerfiles We Created

#### 1. Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app .
EXPOSE 5000
CMD ["node", "server.js"]
```

**What this does:**
- `FROM node:18-alpine`: Start with a lightweight Node.js image
- `WORKDIR /app`: Set working directory inside container
- `COPY package*.json`: Copy dependency files
- `RUN npm ci`: Install dependencies
- `COPY . .`: Copy all application code
- `EXPOSE 5000`: Tell Docker the app runs on port 5000
- `CMD`: Command to start the application

**Result:** Creates an image `nikhilbabhulkar/splitwise-backend:latest`

#### 2. Frontend Dockerfile (`frontend/Dockerfile`)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**What this does:**
- **Stage 1 (builder)**: Build the React app
  - Install dependencies
  - Run `npm run build` to create optimized production files
- **Stage 2**: Serve with Nginx
  - Copy built files to Nginx web server
  - Configure Nginx to serve the React app
  - Expose port 80

**Result:** Creates an image `nikhilbabhulkar/splitwise-frontend:latest`

#### 3. Database - PostgreSQL (No Custom Dockerfile)
We use the official PostgreSQL image from Docker Hub: `postgres:15-alpine`

**Why no custom Dockerfile?**
- PostgreSQL official image is production-ready
- We configure it using environment variables
- Database schema is applied when the app starts

### Docker Images on Docker Hub
When you ran `build-and-push.sh`, it:
1. Built backend image → Pushed to `nikhilbabhulkar/splitwise-backend:latest`
2. Built frontend image → Pushed to `nikhilbabhulkar/splitwise-frontend:latest`
3. These images are now public and can be pulled from anywhere

---

## Part 2: Understanding Kubernetes (The Challenge)

### What is Kubernetes?
Kubernetes (K8s) orchestrates containers. While Docker runs containers, Kubernetes:
- Manages multiple containers across multiple servers
- Automatically restarts failed containers
- Scales containers up/down based on load
- Handles networking between containers
- Manages storage and secrets

### The Challenge: From Docker to Kubernetes

#### Docker Compose (Simple - Local Only)
```yaml
services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
  backend:
    image: nikhilbabhulkar/splitwise-backend
    ports:
      - "5000:5000"
  frontend:
    image: nikhilbabhulkar/splitwise-frontend
    ports:
      - "80:80"
```
**Problem:** Only works on one machine, no scaling, no high availability

#### Kubernetes (Complex - Production Ready)
Kubernetes requires multiple configuration files (manifests) to achieve what Docker Compose does in one file.

---

## Part 3: Kubernetes Components (What We Created)

### 1. Namespace (`k8s/namespace.yaml`)
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: splitwise
```
**Purpose:** Isolates your application resources from others in the cluster

### 2. Secrets (`k8s/secrets.yaml`)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: splitwise-secrets
  namespace: splitwise
type: Opaque
data:
  POSTGRES_PASSWORD: cGFzc3dvcmQxMjM=  # base64 encoded
  JWT_SECRET: eW91ci1zZWNyZXQta2V5LWhlcmU=
```
**Purpose:** Stores sensitive data (passwords, API keys) securely

### 3. ConfigMap (`k8s/configmap.yaml`)
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: splitwise-config
  namespace: splitwise
data:
  POSTGRES_HOST: postgres-service
  POSTGRES_PORT: "5432"
  POSTGRES_DB: splitwise
  POSTGRES_USER: postgres
```
**Purpose:** Stores non-sensitive configuration

### 4. PostgreSQL Deployment (`k8s/postgres-deployment.yaml`)
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: splitwise
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: splitwise
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          valueFrom:
            configMapKeyRef:
              name: splitwise-config
              key: POSTGRES_DB
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: splitwise-secrets
              key: POSTGRES_PASSWORD
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
```

**What this does:**
- **PersistentVolumeClaim**: Requests 5GB storage for database data (survives pod restarts)
- **Deployment**: Defines how to run PostgreSQL
  - `replicas: 1`: Run 1 instance
  - `image: postgres:15-alpine`: Use official PostgreSQL image
  - `env`: Inject configuration from ConfigMap and Secrets
  - `volumeMounts`: Attach persistent storage to `/var/lib/postgresql/data`

**Key Concept:** The database runs in a container, but data is stored on persistent volume

### 5. PostgreSQL Service (`k8s/postgres-service.yaml`)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: splitwise
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
```
**Purpose:** Creates a stable network endpoint `postgres-service:5432` that backend can use to connect to database

### 6. Backend Deployment (`k8s/backend-deployment.yaml`)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: splitwise
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: nikhilbabhulkar/splitwise-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: POSTGRES_HOST
          valueFrom:
            configMapKeyRef:
              name: splitwise-config
              key: POSTGRES_HOST
        # ... more env vars
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5
```

**What this does:**
- `replicas: 2`: Run 2 backend instances for high availability
- `image`: Pull your backend image from Docker Hub
- `env`: Inject database connection details
- `livenessProbe`: Kubernetes checks if container is alive, restarts if not
- `readinessProbe`: Kubernetes checks if container is ready to receive traffic

### 7. Backend Service (`k8s/backend-service.yaml`)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: splitwise
spec:
  selector:
    app: backend
  ports:
  - port: 5000
    targetPort: 5000
  type: ClusterIP
```
**Purpose:** Load balances traffic between 2 backend pods

### 8. Frontend Deployment & Service
Similar to backend, but:
- Runs Nginx serving React app
- `replicas: 2` for high availability
- Exposes port 80

### 9. Ingress (`k8s/ingress.yaml`)
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: splitwise-ingress
  namespace: splitwise
spec:
  ingressClassName: nginx
  rules:
  - host: splitwise.local
    http:
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

**Purpose:** Routes external traffic:
- `splitwise.local/api/*` → backend-service
- `splitwise.local/*` → frontend-service

---

## Part 4: How Docker & Kubernetes Work Together

### The Flow:

1. **Build Phase (Docker)**
   ```
   Source Code → Dockerfile → Docker Build → Docker Image → Docker Hub
   ```

2. **Deploy Phase (Kubernetes)**
   ```
   Docker Hub → Kubernetes pulls images → Creates Pods → Services route traffic
   ```

### Example: Backend Request Flow

```
User Browser
    ↓
http://splitwise.local/api/users
    ↓
Ingress Controller (routes /api/* to backend-service)
    ↓
Backend Service (load balances between 2 pods)
    ↓
Backend Pod 1 or Pod 2 (running your Docker image)
    ↓
Postgres Service
    ↓
Postgres Pod (running postgres:15-alpine image)
    ↓
Persistent Volume (actual database data)
```

---

## Part 5: Key Differences

| Aspect | Docker | Kubernetes |
|--------|--------|------------|
| **Scope** | Single host | Multiple hosts (cluster) |
| **Scaling** | Manual | Automatic |
| **Networking** | Simple port mapping | Services, Ingress, DNS |
| **Storage** | Volumes | PersistentVolumes, PersistentVolumeClaims |
| **Configuration** | Environment variables | ConfigMaps, Secrets |
| **Health Checks** | Basic | Liveness, Readiness, Startup probes |
| **Load Balancing** | None | Built-in |
| **Self-Healing** | No | Yes (restarts failed containers) |

---

## Part 6: Common Challenges & Solutions

### Challenge 1: "Where is my database?"
**Answer:** Database runs in a PostgreSQL container, data stored on PersistentVolume

### Challenge 2: "How do containers talk to each other?"
**Answer:** Kubernetes DNS - backend connects to `postgres-service:5432`

### Challenge 3: "What if a container crashes?"
**Answer:** Kubernetes automatically restarts it (self-healing)

### Challenge 4: "How to update my app?"
**Answer:** 
1. Build new Docker image with new tag
2. Update Kubernetes deployment with new image
3. Kubernetes does rolling update (zero downtime)

### Challenge 5: "Local vs Production?"
**Answer:**
- Local: Minikube (single-node cluster on your laptop)
- Production: AWS EKS, GKE, AKS (multi-node cluster in cloud)

---

## Next Steps: Moving to AWS

We'll deploy to AWS EKS (Elastic Kubernetes Service) which provides:
- Managed Kubernetes cluster
- High availability across multiple availability zones
- Integration with AWS services (RDS, Load Balancers, etc.)
- Production-grade security and monitoring

See `AWS_DEPLOYMENT_GUIDE.md` for step-by-step AWS setup.
