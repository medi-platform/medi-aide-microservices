#!/usr/bin/env bash
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Configuring disk monitoring for Kubernetes...${NC}"

# Create monitoring namespace if it doesn't exist
kubectl create namespace monitoring 2>/dev/null || true

# Create Grafana dashboard ConfigMap
echo -e "${GREEN}Creating Grafana dashboard ConfigMap...${NC}"
kubectl create configmap disk-usage-dashboard \
  --from-file=disk-usage-dashboard.json=kubernetes/monitoring/disk-usage-dashboard.json \
  -n monitoring \
  --dry-run=client -o yaml | kubectl apply -f -

# Apply Prometheus alert rules
echo -e "${GREEN}Applying Prometheus alert rules...${NC}"
kubectl apply -f kubernetes/monitoring/prometheus-disk-alerts.yaml

# Update Prometheus to scrape disk metrics
echo -e "${GREEN}Configuring Prometheus scraping...${NC}"
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: node-exporter
  namespace: monitoring
  labels:
    app: node-exporter
spec:
  type: ClusterIP
  clusterIP: None
  ports:
  - name: metrics
    port: 9100
    targetPort: 9100
  selector:
    app: node-exporter
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      hostNetwork: true
      hostPID: true
      containers:
      - name: node-exporter
        image: prom/node-exporter:latest
        args:
          - --path.rootfs=/host
          - --path.procfs=/host/proc
          - --path.sysfs=/host/sys
          - --collector.filesystem.ignored-mount-points
          - ^/(dev|proc|sys|var/lib/docker/.+)($|/)
          - --collector.filesystem.ignored-fs-types
          - ^(tmpfs|autofs|binfmt_misc|cgroup|configfs|debugfs|devpts|devtmpfs|fusectl|hugetlbfs|mqueue|overlay|proc|procfs|pstore|rpc_pipefs|securityfs|sysfs|tracefs)$
        ports:
        - containerPort: 9100
          name: metrics
        volumeMounts:
        - name: proc
          mountPath: /host/proc
          readOnly: true
        - name: sys
          mountPath: /host/sys
          readOnly: true
        - name: root
          mountPath: /host
          readOnly: true
      volumes:
      - name: proc
        hostPath:
          path: /proc
      - name: sys
        hostPath:
          path: /sys
      - name: root
        hostPath:
          path: /
EOF

echo -e "${GREEN}Disk monitoring configuration complete!${NC}"
echo ""
echo "Access monitoring:"
echo "  Prometheus: http://localhost:9090"
echo "  Grafana: http://localhost:3030 (admin/admin)"
echo ""
echo "Disk usage queries:"
echo "  - Node disk usage: (1 - node_filesystem_avail_bytes/node_filesystem_size_bytes) * 100"
echo "  - Container disk: container_fs_usage_bytes"
echo "  - PVC usage: kubelet_volume_stats_used_bytes/kubelet_volume_stats_capacity_bytes"
