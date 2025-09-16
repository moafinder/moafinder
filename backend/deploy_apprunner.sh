#!/usr/bin/env bash
# One-shot AWS App Runner redeploy for moabit-backend
# - Builds & pushes Docker image to ECR
# - Updates App Runner env, port & health check
# - Triggers deployment
# - Sets PAYLOAD_PUBLIC_SERVER_URL to the live service URL
#
# REQUIREMENTS:
#   - AWS CLI v2 authenticated for the target account
#   - Docker logged in locally
#   - python3 available in PATH (used to generate AWS JSON payloads)
#   - .env present with quoted values (or set envs inline below)
#
# .env example (QUOTED!):
#   DATABASE_URI="mongodb+srv://user:pass@cluster/db?retryWrites=true&w=majority"
#   PAYLOAD_SECRET="a-long-random-secret"

set -euo pipefail

############################
# CHANGE ME (if needed)
############################
AWS_REGION="eu-central-1"
ACCOUNT_ID="913283587816"
REPO="moabit-backend"
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO}"
SERVICE_ARN="arn:aws:apprunner:${AWS_REGION}:${ACCOUNT_ID}:service/moabit-backend/1983a4b57c44498eb5a626353e4d0ecf"  # <— change if your ARN differs
AMPLIFY_URL="https://main.d1i5ilm5fqb0i9.amplifyapp.com"  # only used for CORS
APP_PORT="3000"
HOSTNAME_VALUE="0.0.0.0"

# HEALTH CHECK MODE:
#   TCP first to prove the container boots, then switch to HTTP /api/health at the end.
USE_TCP_HEALTH_FIRST="true"

# Secrets Manager support (optional):
# If you prefer App Runner to read DATABASE_URI / PAYLOAD_SECRET from Secrets Manager,
# set these to the full secret ARNs (and omit the plain-text values in .env).
DATABASE_URI_SECRET_ARN="${DATABASE_URI_SECRET_ARN:-}"
PAYLOAD_SECRET_SECRET_ARN="${PAYLOAD_SECRET_SECRET_ARN:-}"

############################
# LOAD SECRETS
############################
# Option A: from .env (recommended; ensure values are QUOTED to survive &, ?, =)
if [[ -f .env ]]; then
  set -a; source .env; set +a
fi
# Option B: uncomment to set here (if you don't use .env)
# DATABASE_URI='mongodb+srv://user:pass@cluster/db?retryWrites=true&w=majority'
# PAYLOAD_SECRET='a-long-random-secret'

command -v python3 >/dev/null 2>&1 || {
  echo "python3 is required (used to render AWS CLI JSON payloads)." >&2
  exit 1
}

if [[ -z "${DATABASE_URI_SECRET_ARN}" ]]; then
  : "${DATABASE_URI:?DATABASE_URI missing. Put it in .env (quoted!) or export it before running.}"
else
  echo "Using Secrets Manager ARN for DATABASE_URI"
fi

if [[ -z "${PAYLOAD_SECRET_SECRET_ARN}" ]]; then
  : "${PAYLOAD_SECRET:?PAYLOAD_SECRET missing. Put it in .env (quoted!) or export it before running.}"
else
  echo "Using Secrets Manager ARN for PAYLOAD_SECRET"
fi

PORT_VALUE="${PORT:-${APP_PORT}}"
APP_PORT="${PORT_VALUE}"
CORS_ORIGINS_VALUE="${CORS_ORIGINS:-${AMPLIFY_URL}}"

############################
# HELPERS
############################
wait_until_not_in_progress () {
  local status
  while true; do
    status="$(aws apprunner describe-service --region "$AWS_REGION" --service-arn "$SERVICE_ARN" --query 'Service.Status' --output text 2>/dev/null || true)"
    [[ "$status" != "OPERATION_IN_PROGRESS" ]] && break
    echo "Status: $status (waiting...)"
    sleep 6
  done
  echo "Service status: ${status:-UNKNOWN}"
}

wait_until_running_or_failed () {
  local status
  while true; do
    status="$(aws apprunner describe-service --region "$AWS_REGION" --service-arn "$SERVICE_ARN" --query 'Service.Status' --output text 2>/dev/null || true)"
    echo "Status: ${status:-UNKNOWN} (deploying...)"
    [[ "$status" == "RUNNING" || "$status" == "CREATE_FAILED" || "$status" == "DELETED" ]] && break
    sleep 8
  done
  echo "Final status: ${status:-UNKNOWN}"
  [[ "$status" == "CREATE_FAILED" ]] && { echo "❌ Deployment failed. Check App Runner Runtime logs."; exit 1; }
  [[ "$status" == "DELETED" ]] && { echo "❌ Service deleted."; exit 1; }
}

build_image_update_payload () {
  local image_identifier="$1"
  local public_url="$2"

  python3 - "$SERVICE_ARN" "$image_identifier" "$APP_PORT" "$public_url" "${CORS_ORIGINS_VALUE}" "${PORT_VALUE}" "${HOSTNAME_VALUE}" "${DATABASE_URI:-}" "${PAYLOAD_SECRET:-}" "${DATABASE_URI_SECRET_ARN}" "${PAYLOAD_SECRET_SECRET_ARN}" <<'PY'
import json
import sys

(
    service_arn,
    image_identifier,
    app_port,
    public_url,
    cors_origins,
    port_env,
    hostname,
    database_uri,
    payload_secret,
    database_uri_secret_arn,
    payload_secret_secret_arn,
) = sys.argv[1:]

runtime_env_vars = {
    "PORT": port_env or app_port,
    "PAYLOAD_PUBLIC_SERVER_URL": public_url,
    "HOSTNAME": hostname or "0.0.0.0",
}

if cors_origins:
    runtime_env_vars["CORS_ORIGINS"] = cors_origins

runtime_env_secrets = []

if database_uri_secret_arn:
    runtime_env_secrets.append({"Name": "DATABASE_URI", "Value": database_uri_secret_arn})
else:
    runtime_env_vars["DATABASE_URI"] = database_uri

if payload_secret_secret_arn:
    runtime_env_secrets.append({"Name": "PAYLOAD_SECRET", "Value": payload_secret_secret_arn})
else:
    runtime_env_vars["PAYLOAD_SECRET"] = payload_secret

image_configuration = {
    "Port": app_port,
    "RuntimeEnvironmentVariables": runtime_env_vars,
}

if runtime_env_secrets:
    image_configuration["RuntimeEnvironmentSecrets"] = runtime_env_secrets

payload = {
    "ServiceArn": service_arn,
    "SourceConfiguration": {
        "ImageRepository": {
            "ImageIdentifier": image_identifier,
            "ImageRepositoryType": "ECR",
            "ImageConfiguration": image_configuration,
        }
    },
}

print(json.dumps(payload))
PY
}

############################
# 1) BUILD & PUSH IMAGE
############################
docker build -t "${REPO}:latest" .
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ECR_URI}"
docker tag "${REPO}:latest" "${ECR_URI}:latest"
docker push "${ECR_URI}:latest"

APP_IMAGE="${ECR_URI}:latest"

############################
# 2) APPLY RUNTIME ENV + PORT
############################
wait_until_not_in_progress
aws apprunner update-service \
  --region "${AWS_REGION}" \
  --cli-input-json "$(build_image_update_payload "${APP_IMAGE}" "https://placeholder")"

############################
# 3) HEALTH CHECK (TCP → optional)
############################
if [[ "$USE_TCP_HEALTH_FIRST" == "true" ]]; then
  wait_until_not_in_progress
  aws apprunner update-service \
    --region "${AWS_REGION}" \
    --service-arn "${SERVICE_ARN}" \
    --health-check-configuration "Protocol=TCP,Interval=10,Timeout=5,HealthyThreshold=1,UnhealthyThreshold=5" || true
fi

############################
# 4) START DEPLOYMENT (if allowed)
############################
wait_until_not_in_progress
current="$(aws apprunner describe-service --region "$AWS_REGION" --service-arn "$SERVICE_ARN" --query 'Service.Status' --output text)"
if [[ "$current" == "RUNNING" ]]; then
  aws apprunner start-deployment --region "${AWS_REGION}" --service-arn "${SERVICE_ARN}"
fi

wait_until_running_or_failed

SERVICE_HOST="$(aws apprunner describe-service --region "${AWS_REGION}" --service-arn "${SERVICE_ARN}" --query 'Service.ServiceUrl' --output text)"
SERVICE_URL="https://${SERVICE_HOST}"
echo "Service URL: ${SERVICE_URL}"

# Smoke checks (one should 200; if not, open Runtime logs)
(set -x; curl -fsSI "${SERVICE_URL}/api/health" || curl -fsSI "${SERVICE_URL}/")

############################
# 5) SWITCH TO HTTP /api/health
############################
wait_until_not_in_progress
aws apprunner update-service \
  --region "${AWS_REGION}" \
  --service-arn "${SERVICE_ARN}" \
  --health-check-configuration "Protocol=HTTP,Path=/api/health,Interval=10,Timeout=5,HealthyThreshold=1,UnhealthyThreshold=5"

wait_until_not_in_progress
now="$(aws apprunner describe-service --region "$AWS_REGION" --service-arn "$SERVICE_ARN" --query 'Service.Status' --output text)"
[[ "$now" == "RUNNING" ]] && aws apprunner start-deployment --region "${AWS_REGION}" --service-arn "${SERVICE_ARN}"
wait_until_running_or_failed

############################
# 6) SET PUBLIC URL ENV
############################
wait_until_not_in_progress
aws apprunner update-service \
  --region "${AWS_REGION}" \
  --cli-input-json "$(build_image_update_payload "${APP_IMAGE}" "${SERVICE_URL}")"

wait_until_not_in_progress
final_status="$(aws apprunner describe-service --region "$AWS_REGION" --service-arn "$SERVICE_ARN" --query 'Service.Status' --output text)"
echo "✅ Done. Status: ${final_status}. Backend URL: ${SERVICE_URL}"
echo "Remember Amplify rewrite:  /api/<*>  →  ${SERVICE_URL}/api/<*>  (Type 200)"
