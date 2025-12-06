#!/bin/bash
set -euo pipefail

SERVICE=$1
PORT=${2:-3000}

echo "🚀 Deploying $SERVICE to Kubernetes"

# Update deployment to use simple image with all deps
cat <<YAML | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: ${SERVICE}-start
  namespace: medi-aide
data:
  start.sh: |
    #!/bin/sh
    cd /app
    # Install production deps
    npm install --production
    # Start the service
    exec node dist/main.js
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${SERVICE}
  namespace: medi-aide
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${SERVICE}
  template:
    metadata:
      labels:
        app: ${SERVICE}
    spec:
      containers:
      - name: app
        image: host.docker.internal:5001/medi-aide/${SERVICE}:latest
        imagePullPolicy: Always
        command: ["/bin/sh", "/start/start.sh"]
        workingDir: /app
        ports:
        - containerPort: ${PORT}
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "${PORT}"
        volumeMounts:
        - name: start-script
          mountPath: /start
      volumes:
      - name: start-script
        configMap:
          name: ${SERVICE}-start
          defaultMode: 0755
---
apiVersion: v1
kind: Service
metadata:
  name: ${SERVICE}
  namespace: medi-aide
spec:
  selector:
    app: ${SERVICE}
  ports:
  - port: ${PORT}
    targetPort: ${PORT}
YAML

echo "✅ Deployed $SERVICE"
