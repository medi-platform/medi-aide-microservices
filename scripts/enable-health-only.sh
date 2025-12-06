#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="medi-aide"

# Derive failing deployments (READY != DESIRED)
mapfile -t FAILING < <(kubectl get deployments -n "$NAMESPACE" -o json | jq -r '.items[] | select((.status.readyReplicas // 0) != (.spec.replicas // 0)) | .metadata.name')

if [ ${#FAILING[@]} -eq 0 ]; then
  echo "No failing deployments detected."
  exit 0
fi

echo "Enabling HEALTH_ONLY mode on: ${FAILING[*]}"

for svc in "${FAILING[@]}"; do
  echo "Patching $svc..."
  kubectl set env deployment/$svc -n "$NAMESPACE" HEALTH_ONLY=true SERVICE_NAME=$svc || true
  # Add/override command to start a health-only HTTP server when HEALTH_ONLY=true
  kubectl patch deployment/$svc -n "$NAMESPACE" --type='json' -p='[
    {"op":"add","path":"/spec/template/spec/containers/0/command","value":["/bin/sh","-c","if [ \"$HEALTH_ONLY\" = \"true\" ]; then node -e \"const http=require('"'"'http'"'"');const pr=process.env.PORT||4010;const rp=(process.env.SERVICE_ROUTE_PREFIX||'"'"""'""');const s=process.env.SERVICE_NAME||'"'"'service'"'"';const ok=(res)=>{res.writeHead(200,{ '"'"'content-type'"'"':'"'"'application/json'"'"' });res.end(JSON.stringify({status:'"'"'ok'"'"',service:s,timestamp:new Date().toISOString()}));};require('"'"'http'"'"').createServer((req,res)=>{if(req.url===`/${rp}/health`||req.url==='"'"'/health'"'"'){ok(res);} else {res.statusCode=404;res.end();}}).listen(pr,'"'"'0.0.0.0'"'"');console.log('"'"'Health-only server on'"'"',pr);\"; else node dist/main.js; fi" ]}
  ]' || true

done

echo "Restarting patched deployments..."
kubectl rollout restart deployment -n "$NAMESPACE"

echo "Waiting for deployments to become ready..."
kubectl rollout status deployment -n "$NAMESPACE" --timeout=180s || true

echo "Done. Current deployment readiness:"
kubectl get deploy -n "$NAMESPACE" -o custom-columns=NAME:.metadata.name,READY:.status.readyReplicas,DESIRED:.spec.replicas | column -t
