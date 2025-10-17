#!/usr/bin/env bash
# One-shot AWS App Runner redeploy for moabit-backend
# - Builds & pushes Docker image to ECR
# - Updates App Runner env, port & health check
# - Triggers deployment
# - Sets PAYLOAD_PUBLIC_SERVER_URL to the live service URL
#
# Usage:
#   ./deploy_apprunner.sh --target production
#
# Flags:
#   --target/-t <name>   Regenerate env/<name>.envset via scripts/apply-env.mjs (default: production)
#   --env-file/-f <path> Use a specific env file for App Runner overrides
#   --skip-apply         Skip running scripts/apply-env.mjs (use existing env files)
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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

TARGET=""
ENV_FILE=""
SKIP_APPLY="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target|-t)
      [[ $# -ge 2 ]] || { echo "--target requires a value" >&2; exit 1; }
      TARGET="$2"
      shift 2
      ;;
    --env-file|-f)
      [[ $# -ge 2 ]] || { echo "--env-file requires a value" >&2; exit 1; }
      ENV_FILE="$2"
      shift 2
      ;;
    --skip-apply)
      SKIP_APPLY="true"
      shift
      ;;
    --help|-h)
      cat <<'EOF'
Usage: ./deploy_apprunner.sh [options]

Options:
  --target, -t <name>    Render env/<name>.envset via scripts/apply-env.mjs before deploying.
                         Defaults to "production".
  --env-file, -f <path>  Use a specific env file for App Runner overrides.
                         Defaults to ../env/out/<target>-apprunner.env.
  --skip-apply           Skip running scripts/apply-env.mjs even if --target is provided.
  --help, -h             Show this help and exit.
EOF
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

TARGET="${TARGET:-production}"
ENV_FILE="${ENV_FILE:-../env/out/${TARGET}-apprunner.env}"

if [[ "$SKIP_APPLY" != "true" ]]; then
  if [[ -f ../scripts/apply-env.mjs ]]; then
    command -v node >/dev/null 2>&1 || { echo "node is required to render env targets" >&2; exit 1; }
    echo "Rendering env target '${TARGET}' via scripts/apply-env.mjs ..."
    node ../scripts/apply-env.mjs "$TARGET"
  fi
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

export AWS_PAGER=""

############################
# CHANGE ME (if needed)
############################
AWS_REGION="${AWS_REGION:-eu-central-1}"
ACCOUNT_ID="${ACCOUNT_ID:-913283587816}"
REPO="${REPO:-moabit-backend}"
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO}"
SERVICE_ARN="${SERVICE_ARN:-arn:aws:apprunner:${AWS_REGION}:${ACCOUNT_ID}:service/moabit-backend/1983a4b57c44498eb5a626353e4d0ecf}"  # <— change if your ARN differs
AMPLIFY_URL="${AMPLIFY_URL:-https://main.dgfhrurhtm4pa.amplifyapp.com}"  # only used for CORS
APP_PORT="${APP_PORT:-3000}"
HOSTNAME_VALUE="${HOSTNAME_VALUE:-0.0.0.0}"


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

# Ensure ENV_FILE is absolute and export its values into the current shell
ENV_FILE="$(python3 - "$ENV_FILE" <<'PY'
import sys
from pathlib import Path
path = Path(sys.argv[1]).expanduser().resolve()
print(path)
PY
)"

eval "$(python3 - "$ENV_FILE" <<'PY'
import shlex
import sys
from pathlib import Path

path = Path(sys.argv[1])
if not path.exists():
    raise SystemExit(f"Env file not found: {path}")

for raw_line in path.read_text(encoding='utf-8').splitlines():
    stripped = raw_line.strip()
    if not stripped or stripped.startswith('#'):
        continue
    if '=' not in raw_line:
        continue
    key, value = raw_line.split('=', 1)
    key = key.strip()
    value = value.strip()
    if not key:
        continue
    if value and ((value[0] == value[-1]) and value[0] in {'"', "'"}):
        value = value[1:-1]
    print(f"export {key}={shlex.quote(value)}")
PY
)"

echo "Loaded App Runner env overrides from ${ENV_FILE}"

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
HEALTHCHECK_WARMUP_MS_VALUE="${HEALTHCHECK_WARMUP_MS:-}"
HEALTHCHECK_PING_TIMEOUT_MS_VALUE="${HEALTHCHECK_PING_TIMEOUT_MS:-}"

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
  local env_file_path="$3"

  python3 - "$SERVICE_ARN" "$image_identifier" "$APP_PORT" "$public_url" "${CORS_ORIGINS_VALUE}" "${PORT_VALUE}" "${HOSTNAME_VALUE}" "${DATABASE_URI:-}" "${PAYLOAD_SECRET:-}" "${DATABASE_URI_SECRET_ARN}" "${PAYLOAD_SECRET_SECRET_ARN}" "${HEALTHCHECK_WARMUP_MS_VALUE}" "${HEALTHCHECK_PING_TIMEOUT_MS_VALUE}" "$env_file_path" <<'PY'
import json
import os
import sys
from pathlib import Path

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
    healthcheck_warmup_ms,
    healthcheck_ping_timeout_ms,
    env_file_path,
) = sys.argv[1:]


def load_env_file(path_str):
    result = {}
    if not path_str:
        return result
    path = Path(path_str)
    if not path.exists():
        return result
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        stripped = raw_line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if "=" not in raw_line:
            continue
        key, value = raw_line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if not key:
            continue
        if value and ((value[0] == value[-1]) and value[0] in {"'", '"'}):
            value = value[1:-1]
        result[key] = value
    return result


runtime_env_vars = load_env_file(env_file_path)

if port_env or app_port:
    runtime_env_vars.setdefault("PORT", port_env or app_port)

# Don't clobber an existing PAYLOAD_PUBLIC_SERVER_URL with a placeholder
if public_url and public_url != "https://placeholder":
    runtime_env_vars["PAYLOAD_PUBLIC_SERVER_URL"] = public_url
else:
    runtime_env_vars.setdefault("PAYLOAD_PUBLIC_SERVER_URL", public_url)
runtime_env_vars.setdefault("HOSTNAME", hostname or "0.0.0.0")

if cors_origins and not runtime_env_vars.get("CORS_ORIGINS"):
    runtime_env_vars["CORS_ORIGINS"] = cors_origins

runtime_env_secrets = []

if database_uri_secret_arn:
    runtime_env_secrets.append({"Name": "DATABASE_URI", "Value": database_uri_secret_arn})
elif database_uri:
    runtime_env_vars.setdefault("DATABASE_URI", database_uri)

if payload_secret_secret_arn:
    runtime_env_secrets.append({"Name": "PAYLOAD_SECRET", "Value": payload_secret_secret_arn})
elif payload_secret:
    runtime_env_vars.setdefault("PAYLOAD_SECRET", payload_secret)

if healthcheck_warmup_ms:
    runtime_env_vars.setdefault("HEALTHCHECK_WARMUP_MS", healthcheck_warmup_ms)

if healthcheck_ping_timeout_ms:
    runtime_env_vars.setdefault("HEALTHCHECK_PING_TIMEOUT_MS", healthcheck_ping_timeout_ms)

for key in [
    "SMTP_ENABLE",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM_EMAIL",
    "SMTP_FROM_NAME",
    "EMAIL_FROM",
    "EMAIL_FROM_NAME",
    "CONTACT_RECIPIENT_EMAILS",
    "EVENT_APPROVAL_NOTIFICATION_EMAILS",
]:
    if key not in runtime_env_vars:
        value = os.getenv(key)
        if value:
            runtime_env_vars[key] = value

runtime_env_vars = {k: str(v) for k, v in runtime_env_vars.items() if v is not None}

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
  --cli-input-json "$(build_image_update_payload "${APP_IMAGE}" "https://placeholder" "${ENV_FILE}")"

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
  --cli-input-json "$(build_image_update_payload "${APP_IMAGE}" "${SERVICE_URL}" "${ENV_FILE}")"

wait_until_not_in_progress
final_status="$(aws apprunner describe-service --region "$AWS_REGION" --service-arn "$SERVICE_ARN" --query 'Service.Status' --output text)"
echo "✅ Done. Status: ${final_status}. Backend URL: ${SERVICE_URL}"
echo "Remember Amplify rewrite:  /api/<*>  →  ${SERVICE_URL}/api/<*>  (Type 200)"
