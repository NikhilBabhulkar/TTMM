# Kubernetes Deployment Files

This directory contains all Kubernetes manifests for deploying the Splitwise application.

## Files Overview

- `namespace.yaml` - Creates the splitwise namespace
- `secrets.yaml` - Database and JWT secrets
- `configmap.yaml` - Application configuration
- `postgres-deployment.yaml` - PostgreSQL database deployment and service
- `backend-deployment.yaml` - Backend API deployment and service
- `frontend-deployment.yaml` - Frontend React app deployment and service
- `ingress.yaml` - Ingress rules for routing traffic

## Quick Deploy

```bash
# Deploy everything in order
kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml
kubectl apply -f configmap.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f ingress.yaml

# Or deploy all at once
kubectl apply -f k8s/
```

## Important Notes

1. **Update Docker Hub username** in:
   - `backend-deployment.yaml` (line 15)
   - `frontend-deployment.yaml` (line 15)

2. **Change secrets** in production:
   - Edit `secrets.yaml` with secure passwords
   - Use `kubectl create secret` instead of YAML files

3. **Resource limits** are set conservatively:
   - Adjust based on your cluster capacity
   - Monitor with `kubectl top pods -n splitwise`

## Verify Deployment

```bash
kubectl get all -n splitwise
kubectl get pods -n splitwise
kubectl logs -f deployment/backend -n splitwise
```
