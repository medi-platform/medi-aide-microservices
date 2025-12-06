#!/usr/bin/env bash
set -euo pipefail

# Update all deployments to use local registry
REGISTRY="localhost:5001"
NAMESPACE="medi-aide"

echo "Updating deployments to use local registry..."

# Get all deployments
deployments=$(kubectl get deployments -n $NAMESPACE -o json | jq -r '.items[].metadata.name')

for deployment in $deployments; do
  echo "Updating $deployment..."
  
  # Extract service name from deployment name
  service_name=$deployment
  
  # Update the image
  kubectl set image deployment/$deployment \
    $service_name=$REGISTRY/medi-aide/$service_name:latest \
    -n $NAMESPACE
done

echo "All deployments updated to use local registry!"
echo ""
echo "Rolling out updates..."
kubectl rollout restart deployment -n $NAMESPACE

echo ""
echo "Monitor rollout status with:"
echo "kubectl rollout status deployment -n $NAMESPACE"
