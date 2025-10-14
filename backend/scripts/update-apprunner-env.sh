#!/usr/bin/env bash
set -euo pipefail

# Update an existing AWS App Runner service's environment variables using a .env-style file.
# - Merges with existing RuntimeEnvironmentVariables (overrides with values from the file).
# - Keeps the current image identifier (does not rebuild/push).
#
# Usage:
#   backend/scripts/update-apprunner-env.sh \
#     --service-arn arn:aws:apprunner:<region>:<account>:service/<name>/<id> \
#     [--env-file env/out/production-apprunner.env] \
#     [--region eu-central-1]
#
# Environment variables can be used instead of flags:
#   SERVICE_ARN, ENV_FILE, AWS_REGION

SERVICE_ARN="${SERVICE_ARN:-}"
ENV_FILE="${ENV_FILE:-env/out/production-apprunner.env}"
REGION="${AWS_REGION:-}"

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --service-arn)
      SERVICE_ARN="$2"; shift 2 ;;
    --env-file)
      ENV_FILE="$2"; shift 2 ;;
    --region)
      REGION="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: $0 --service-arn <arn> [--env-file <path>] [--region <region>]"; exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$SERVICE_ARN" ]]; then
  echo "ERROR: --service-arn is required (or set SERVICE_ARN env var)." >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Env file not found: $ENV_FILE" >&2
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "ERROR: aws CLI not found in PATH." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 is required." >&2
  exit 1
fi

# Default region from AWS config if not provided
if [[ -z "$REGION" ]]; then
  REGION="$(aws configure get region || true)"
fi

if [[ -z "$REGION" ]]; then
  echo "ERROR: AWS region not set. Pass --region or set AWS_REGION or configure a default." >&2
  exit 1
fi

echo "Reading current service configuration ..."
IMAGE_ID="$(aws apprunner describe-service --region "$REGION" --service-arn "$SERVICE_ARN" --query 'Service.SourceConfiguration.ImageRepository.ImageIdentifier' --output text)"

if [[ -z "$IMAGE_ID" || "$IMAGE_ID" == "None" ]]; then
  echo "ERROR: Could not determine current ImageIdentifier for the service." >&2
  exit 1
fi

EXISTING_ENV_JSON="$(aws apprunner describe-service --region "$REGION" --service-arn "$SERVICE_ARN" --query 'Service.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables' --output json)"
if [[ -z "$EXISTING_ENV_JSON" || "$EXISTING_ENV_JSON" == "null" ]]; then
  EXISTING_ENV_JSON='[]'
fi

echo "Merging variables from $ENV_FILE into existing runtime env ..."
PAYLOAD_JSON="$(python3 - "$SERVICE_ARN" "$IMAGE_ID" "$EXISTING_ENV_JSON" "$ENV_FILE" <<'PY'
import json
import os
import sys

service_arn = sys.argv[1]
image_id = sys.argv[2]
existing_env_json = sys.argv[3]
env_file_path = sys.argv[4]

# Parse existing env to dict (supports both list [{Name,Value}] and map {Name:Value})
try:
    parsed_existing = json.loads(existing_env_json) if existing_env_json else {}
except json.JSONDecodeError:
    parsed_existing = {}

existing = {}
if isinstance(parsed_existing, list):
    for item in parsed_existing:
        if isinstance(item, dict) and 'Name' in item and 'Value' in item:
            existing[item['Name']] = item['Value']
elif isinstance(parsed_existing, dict):
    existing = {str(k): str(v) for k, v in parsed_existing.items() if k}

# Parse .env-style file (KEY=VALUE, ignore comments/blank lines)
new_vars = {}
with open(env_file_path, 'r', encoding='utf-8') as f:
    for raw in f:
        line = raw.strip()
        if not line or line.startswith('#'):
            continue
        if '=' not in line:
            continue
        key, value = line.split('=', 1)
        key = key.strip()
        value = value.strip()
        # Strip surrounding quotes if present
        if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
            value = value[1:-1]
        if key:
            new_vars[key] = value

# Merge (file values override)
merged = {**existing, **new_vars}

runtime_env = {k: v for k, v in sorted(merged.items())}

payload = {
    "ServiceArn": service_arn,
    "SourceConfiguration": {
        "ImageRepository": {
            "ImageIdentifier": image_id,
            "ImageRepositoryType": "ECR",
            "ImageConfiguration": {
                "RuntimeEnvironmentVariables": runtime_env
            }
        }
    }
}

print(json.dumps(payload))
PY
)"

echo "Updating service environment ..."
aws apprunner update-service --region "$REGION" --cli-input-json "$PAYLOAD_JSON" >/dev/null

# If service is RUNNING, trigger deployment to apply env change quickly
status="$(aws apprunner describe-service --region "$REGION" --service-arn "$SERVICE_ARN" --query 'Service.Status' --output text)"
if [[ "$status" == "RUNNING" ]]; then
  aws apprunner start-deployment --region "$REGION" --service-arn "$SERVICE_ARN" >/dev/null || true
fi

echo "Waiting for service to stabilize ..."
while true; do
  s="$(aws apprunner describe-service --region "$REGION" --service-arn "$SERVICE_ARN" --query 'Service.Status' --output text 2>/dev/null || true)"
  [[ "$s" != "OPERATION_IN_PROGRESS" ]] && break
  sleep 5
done

URL="$(aws apprunner describe-service --region "$REGION" --service-arn "$SERVICE_ARN" --query 'Service.ServiceUrl' --output text)"
echo "Done. Status: ${s:-UNKNOWN}. URL: https://$URL"
echo "Applied variables from: $ENV_FILE"
