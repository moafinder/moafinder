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
#   - jq optional (not required)
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

# HEALTH CHECK MODE:
#   TCP first to prove the container boots, then switch to HTTP /api/health at the end.
USE_TCP_HEALTH_FIRST="true"

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

: "${DATABASE_URI:?DATABASE_URI missing. Put it in .env (quoted!) or export it before running.}"
: "${PAYLOAD_SECRET:?PAYLOAD_SECRET missing. Put it in .env (quoted!) or export it before running.}"

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
  --service-arn "${SERVICE_ARN}" \
  --source-configuration ImageRepository="{ImageIdentifier='${APP_IMAGE}',ImageRepositoryType='ECR',ImageConfiguration={Port='3000',RuntimeEnvironmentVariables={DATABASE_URI='${DATABASE_URI}',PAYLOAD_SECRET='${PAYLOAD_SECRET}',PORT='3000',PAYLOAD_PUBLIC_SERVER_URL='https://placeholder',CORS_ORIGINS='${AMPLIFY_URL}'}}}"

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
  --service-arn "${SERVICE_ARN}" \
  --source-configuration ImageRepository="{ImageIdentifier='${APP_IMAGE}',ImageRepositoryType='ECR',ImageConfiguration={Port='3000',RuntimeEnvironmentVariables={DATABASE_URI='${DATABASE_URI}',PAYLOAD_SECRET='${PAYLOAD_SECRET}',PORT='3000',PAYLOAD_PUBLIC_SERVER_URL='${SERVICE_URL}',CORS_ORIGINS='${AMPLIFY_URL}'}}}"

wait_until_not_in_progress
final_status="$(aws apprunner describe-service --region "$AWS_REGION" --service-arn "$SERVICE_ARN" --query 'Service.Status' --output text)"
echo "✅ Done. Status: ${final_status}. Backend URL: ${SERVICE_URL}"
echo "Remember Amplify rewrite:  /api/<*>  →  ${SERVICE_URL}/api/<*>  (Type 200)"
