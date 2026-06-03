#!/usr/bin/env bash
set -euo pipefail

if (($# == 0)); then
  echo "Usage: $0 <service-name> [service-name ...]" >&2
  exit 64
fi

: "${AWS_REGION:?AWS_REGION is required}"
: "${ECR_REGISTRY:?ECR_REGISTRY is required}"
: "${ECS_CLUSTER:?ECS_CLUSTER is required}"
: "${IMAGE_TAG:?IMAGE_TAG is required}"

PROJECT_NAME="${PROJECT_NAME:-medi-aide}"
DEPLOY_ENV="${DEPLOY_ENV:-staging}"
ECS_SERVICE_PREFIX="${ECS_SERVICE_PREFIX:-}"
ECS_SERVICE_MAP="${ECS_SERVICE_MAP:-{}}"
ECS_DEPLOY_REQUIRE_ALL="${ECS_DEPLOY_REQUIRE_ALL:-true}"

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

map_service_name() {
  local service="$1"
  jq -er --arg service "$service" '.[$service] // empty' <<<"$ECS_SERVICE_MAP" 2>/dev/null || true
}

service_candidates() {
  local service="$1"
  local mapped
  mapped="$(map_service_name "$service")"

  if [[ -n "$mapped" ]]; then
    printf '%s\n' "$mapped"
  fi

  printf '%s\n' "$service"

  if [[ -n "$ECS_SERVICE_PREFIX" ]]; then
    printf '%s\n' "${ECS_SERVICE_PREFIX}-${service}"
  fi

  printf '%s\n' \
    "${PROJECT_NAME}-${service}" \
    "${PROJECT_NAME}-${DEPLOY_ENV}-${service}" \
    "${PROJECT_NAME}-${service}-${DEPLOY_ENV}" \
    "${DEPLOY_ENV}-${service}" |
    awk 'NF && !seen[$0]++'
}

resolve_ecs_service() {
  local service="$1"
  local candidate service_arn

  while IFS= read -r candidate; do
    service_arn="$(aws ecs describe-services \
      --region "$AWS_REGION" \
      --cluster "$ECS_CLUSTER" \
      --services "$candidate" \
      --query 'services[0].serviceArn' \
      --output text 2>/dev/null || true)"

    if [[ -n "$service_arn" && "$service_arn" != "None" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done < <(service_candidates "$service")

  return 1
}

register_task_definition_with_image() {
  local service="$1"
  local ecs_service="$2"
  local image_uri="$3"
  local current_td new_td updated_count

  current_td="$(aws ecs describe-services \
    --region "$AWS_REGION" \
    --cluster "$ECS_CLUSTER" \
    --services "$ecs_service" \
    --query 'services[0].taskDefinition' \
    --output text)"

  aws ecs describe-task-definition \
    --region "$AWS_REGION" \
    --task-definition "$current_td" \
    --query 'taskDefinition' \
    --output json > "$tmpdir/${service}.taskdef.json"

  jq --arg image "$image_uri" --arg service "$service" --arg short_service "${service%-service}" '
    .containerDefinitions = (
      if (.containerDefinitions | length) == 1 then
        .containerDefinitions | map(.image = $image)
      else
        .containerDefinitions | map(
          if .name == $service or .name == $short_service or .name == "app" then
            .image = $image
          else
            .
          end
        )
      end
    )
    | del(
      .taskDefinitionArn,
      .revision,
      .status,
      .requiresAttributes,
      .compatibilities,
      .registeredAt,
      .registeredBy
    )
  ' "$tmpdir/${service}.taskdef.json" > "$tmpdir/${service}.taskdef.new.json"

  updated_count="$(jq --arg image "$image_uri" '[.containerDefinitions[] | select(.image == $image)] | length' "$tmpdir/${service}.taskdef.new.json")"
  if [[ "$updated_count" == "0" ]]; then
    echo "::error::No container in task definition $current_td matched $service, ${service%-service}, app, or the single-container fallback." >&2
    exit 1
  fi

  new_td="$(aws ecs register-task-definition \
    --region "$AWS_REGION" \
    --cli-input-json "file://$tmpdir/${service}.taskdef.new.json" \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)"

  printf '%s\n' "$new_td"
}

missing_services=()

for service in "$@"; do
  image_uri="${ECR_REGISTRY}/${PROJECT_NAME}/${service}:${IMAGE_TAG}"
  echo "Deploying $service to ECS cluster $ECS_CLUSTER with image $image_uri"

  if ! ecs_service="$(resolve_ecs_service "$service")"; then
    echo "::warning::No ECS service found for $service in cluster $ECS_CLUSTER."
    missing_services+=("$service")
    continue
  fi

  task_definition_arn="$(register_task_definition_with_image "$service" "$ecs_service" "$image_uri")"

  aws ecs update-service \
    --region "$AWS_REGION" \
    --cluster "$ECS_CLUSTER" \
    --service "$ecs_service" \
    --task-definition "$task_definition_arn" \
    --query 'service.serviceArn' \
    --output text

  aws ecs wait services-stable \
    --region "$AWS_REGION" \
    --cluster "$ECS_CLUSTER" \
    --services "$ecs_service"

  echo "OK: $service deployed through ECS service $ecs_service"
done

if ((${#missing_services[@]} > 0)); then
  printf 'Missing ECS services: %s\n' "${missing_services[*]}" >&2
  if [[ "$ECS_DEPLOY_REQUIRE_ALL" == "true" ]]; then
    exit 1
  fi
fi
