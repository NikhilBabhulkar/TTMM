# Kubectl & Minikube Setup Complete!

## ✅ What's Installed

- kubectl (v1.34.5) - Kubernetes command-line tool
- Minikube (v1.38.1) - Local Kubernetes cluster

## 🚀 Minikube is Starting

Minikube is currently downloading and starting. This takes 5-10 minutes the first time.

### Check Minikube Status

```bash
# Check if Minikube is ready
minikube status

# Once ready, you should see:
# minikube
# type: Control Plane
# host: Running
# kubelet: Running
# apiserver: Running
# kubeconfig: Configured
```

### Enable Ingress (After Minikube Starts)

```bash
# Enable ingress addon
minikube addons enable ingress

# Verify kubectl works
kubectl get nodes
```

## 📦 Deploy Your Application

Once Minikube is running:

```bash
cd splitwise-devops-project

# Deploy everything
./scripts/deploy.sh

# Or manually:
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

## 🌐 Access Your Application

```bash
# Get Minikube IP
minikube ip

# Add to /etc/hosts
echo "$(minikube ip) splitwise.local" | sudo tee -a /etc/hosts

# Access application
# Frontend: http://splitwise.local
# Backend: http://splitwise.local/api
```

## 🔍 Useful Commands

```bash
# Check all resources
kubectl get all -n splitwise

# Check pods
kubectl get pods -n splitwise

# View logs
kubectl logs -f deployment/backend -n splitwise
kubectl logs -f deployment/frontend -n splitwise

# Check services
kubectl get svc -n splitwise

# Check ingress
kubectl get ingress -n splitwise

# Open Minikube dashboard
minikube dashboard
```

## 🛑 Stop/Start Minikube

```bash
# Stop Minikube (saves state)
minikube stop

# Start Minikube again
minikube start

# Delete Minikube cluster
minikube delete
```

## 📊 Monitor Resources

```bash
# Check resource usage
kubectl top nodes
kubectl top pods -n splitwise

# Describe a pod
kubectl describe pod POD_NAME -n splitwise

# Get pod details
kubectl get pod POD_NAME -n splitwise -o yaml
```

## 🔧 Troubleshooting

### Minikube Won't Start
```bash
# Delete and recreate
minikube delete
minikube start --driver=docker --cpus=2 --memory=4096
```

### Pods Not Starting
```bash
# Check pod status
kubectl get pods -n splitwise

# Describe pod to see errors
kubectl describe pod POD_NAME -n splitwise

# Check logs
kubectl logs POD_NAME -n splitwise
```

### Can't Access Application
```bash
# Verify ingress is running
kubectl get ingress -n splitwise

# Check if ingress controller is running
kubectl get pods -n ingress-nginx

# Verify /etc/hosts entry
cat /etc/hosts | grep splitwise
```

## 🎯 Next Steps

1. Wait for Minikube to finish starting (check with `minikube status`)
2. Enable ingress addon
3. Deploy your application using `./scripts/deploy.sh`
4. Add splitwise.local to /etc/hosts
5. Access your application at http://splitwise.local

---

**Your Kubernetes environment is being set up!** ⏳

Check status with: `minikube status`
