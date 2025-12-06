#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="argocd"

kubectl get ns "$NAMESPACE" >/dev/null 2>&1 || kubectl create namespace "$NAMESPACE"

kubectl apply -n "$NAMESPACE" -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD server to be ready
kubectl rollout status deployment/argocd-server -n "$NAMESPACE" --timeout=180s || true

# Apply project and app-of-apps
kubectl apply -f kubernetes/argocd/project-medi-aide.yaml
kubectl apply -f kubernetes/argocd/app-of-apps.yaml

echo "ArgoCD bootstrap applied. Access with: kubectl port-forward svc/argocd-server -n argocd 8080:443"

