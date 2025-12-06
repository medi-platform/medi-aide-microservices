#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Setting up local Docker registry for Kind...${NC}"

# Check if registry is already running
if docker ps -a | grep -q kind-registry; then
    echo -e "${YELLOW}Registry already exists. Removing old instance...${NC}"
    docker stop kind-registry || true
    docker rm kind-registry || true
fi

# Create registry container
echo -e "${GREEN}Creating local registry container...${NC}"
docker run -d \
    --restart=always \
    --name kind-registry \
    -p 5001:5000 \
    -v kind-registry-data:/var/lib/registry \
    registry:2

# Wait for registry to be ready
echo -e "${GREEN}Waiting for registry to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5001/v2/ >/dev/null 2>&1; then
        echo -e "${GREEN}Registry is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Create or update Kind config with registry
cat > kubernetes/kind-config-with-registry.yaml << 'EOF'
# Kind cluster configuration with local registry
apiVersion: kind.x-k8s.io/v1alpha4
kind: Cluster
name: medi-aide
containerdConfigPatches:
- |-
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:5001"]
    endpoint = ["http://kind-registry:5000"]
nodes:
  # Control plane node
  - role: control-plane
    kubeadmConfigPatches:
      - |
        kind: InitConfiguration
        nodeRegistration:
          kubeletExtraArgs:
            node-labels: "ingress-ready=true"
    extraPortMappings:
      # HTTP
      - containerPort: 80
        hostPort: 80
        protocol: TCP
      # HTTPS
      - containerPort: 443
        hostPort: 443
        protocol: TCP
      # Kong Admin API
      - containerPort: 8001
        hostPort: 18001
        protocol: TCP
      # Prometheus
      - containerPort: 30090
        hostPort: 9090
        protocol: TCP
      # Grafana
      - containerPort: 30030
        hostPort: 3030
        protocol: TCP
  # Worker nodes
  - role: worker
    extraMounts:
      - hostPath: /var/run/docker.sock
        containerPath: /var/run/docker.sock
  - role: worker
    extraMounts:
      - hostPath: /var/run/docker.sock
        containerPath: /var/run/docker.sock
  - role: worker
    extraMounts:
      - hostPath: /var/run/docker.sock
        containerPath: /var/run/docker.sock
EOF

# Connect registry to kind network (if cluster exists)
if kind get clusters | grep -q medi-aide; then
    echo -e "${GREEN}Connecting registry to kind network...${NC}"
    docker network connect kind kind-registry 2>/dev/null || true
    
    # Add registry config to existing cluster
    echo -e "${GREEN}Configuring nodes to use local registry...${NC}"
    for node in $(kind get nodes --name medi-aide); do
        docker exec "$node" sh -c "
            mkdir -p /etc/containerd
            cat <<EOT >> /etc/containerd/config.toml
[plugins.\"io.containerd.grpc.v1.cri\".registry.mirrors.\"localhost:5001\"]
  endpoint = [\"http://kind-registry:5000\"]
EOT
            systemctl restart containerd || true
        "
    done
fi

echo -e "${GREEN}Local registry setup complete!${NC}"
echo ""
echo "Usage:"
echo "  1. Tag images: docker tag <image> localhost:5001/<image>:<tag>"
echo "  2. Push to registry: docker push localhost:5001/<image>:<tag>"
echo "  3. Use in K8s: image: localhost:5001/<image>:<tag>"
echo ""
echo "To recreate cluster with registry support:"
echo "  kind create cluster --config kubernetes/kind-config-with-registry.yaml"
