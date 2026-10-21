#!/usr/bin/env bash
# Create a Kind cluster, load locally built images and deploy the app.
set -euo pipefail

CLUSTER="task-manager"
TAG="local"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! kind get clusters | grep -qx "$CLUSTER"; then
  kind create cluster --name "$CLUSTER" --config "$ROOT/k8s/kind-config.yaml"
fi

for service in backend frontend; do
  docker build -t "task-manager-$service:$TAG" "$ROOT/$service"
done
docker build -t "task-manager-proxy:$TAG" "$ROOT/nginx"

kind load docker-image --name "$CLUSTER" \
  "task-manager-backend:$TAG" "task-manager-frontend:$TAG" "task-manager-proxy:$TAG"

kubectl apply -k "$ROOT/k8s"
for deploy in postgres backend frontend proxy; do
  kubectl -n task-manager rollout status "deployment/$deploy" --timeout=180s
done

kubectl -n task-manager get pods,svc
echo "App is available at http://localhost:8081"
