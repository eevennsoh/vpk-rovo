#!/bin/bash
set -euo pipefail

# Deploy script for non-technical users

echo "🚀 Prototype Deployment Helper"
echo ""

# Check if service name provided.
# Using ${1:-} (not $1) so `set -u` doesn't abort before we can print the
# usage help when the user runs the script with no arguments.
if [ -z "${1:-}" ]; then
  echo "❌ Please provide a service name"
  echo "Usage: ./scripts/deploy.sh <service-name> <version>"
  echo "Example: ./scripts/deploy.sh my-prototype 1.0.1"
  echo ""
  echo "⚠️  Service name must be ≤26 characters"
  exit 1
fi

SERVICE_NAME=$1
VERSION=${2:-1.0.1}

# Resolve ENV with the following precedence (highest first):
#   1. 3rd positional arg               (./deploy.sh <svc> <ver> <env>)
#   2. ENV from .deploy.local           (sourced if file exists)
#   3. Default: pdev-west2
# Valid pdev environments: pdev-west2, pdev-apse2 (only two exist)
if [ -n "${3:-}" ]; then
  ENV=$3
elif [ -f ".deploy.local" ] && grep -q '^ENV=' .deploy.local; then
  # shellcheck disable=SC1091
  source .deploy.local
  ENV=${ENV:-pdev-west2}
else
  ENV="pdev-west2"
fi

# Validate environment is one of the two pdev envs
case "$ENV" in
  pdev-west2|pdev-apse2) ;;
  *)
    echo "⚠️  Warning: '$ENV' is not a known pdev environment."
    echo "    Valid pdev envs: pdev-west2 (us-west-2), pdev-apse2 (ap-southeast-2)."
    echo "    Continuing anyway in case you're targeting a non-pdev env."
    ;;
esac

# Validate service name length
if [ ${#SERVICE_NAME} -gt 26 ]; then
  echo "❌ Service name too long (${#SERVICE_NAME} chars). Maximum is 26."
  exit 1
fi

echo "Service: $SERVICE_NAME"
echo "Version: $VERSION"
echo "Environment: $ENV"
echo ""

# Check if service descriptor has been updated from placeholder (for forked repos)
if grep -q "docker.atl-paas.net/YOUR-SERVICE-NAME" service-descriptor.yml && [ "$SERVICE_NAME" != "YOUR-SERVICE-NAME" ]; then
  echo "❌ ERROR: You're trying to deploy '$SERVICE_NAME' but service-descriptor.yml still has placeholder values"
  echo ""
  echo "You must update service-descriptor.yml before deploying:"
  echo "  1. Replace 'YOUR-SERVICE-NAME' with '$SERVICE_NAME'"
  echo "  2. Update notification email (line 7)"
  echo ""
  echo "Update these lines in service-descriptor.yml:"
  echo "  Line 11: image: docker.atl-paas.net/$SERVICE_NAME"
  echo "  Line 16: AI_GATEWAY_URL: ((ssm:/$SERVICE_NAME/AI_GATEWAY_URL))"
  echo "  Line 17: AI_GATEWAY_USE_CASE_ID: ((ssm:/$SERVICE_NAME/AI_GATEWAY_USE_CASE_ID))"
  echo "  Line 18: AI_GATEWAY_CLOUD_ID: ((ssm:/$SERVICE_NAME/AI_GATEWAY_CLOUD_ID))"
  echo "  Line 19: AI_GATEWAY_USER_ID: ((ssm:/$SERVICE_NAME/AI_GATEWAY_USER_ID))"
  echo "  Line 20: ASAP_PRIVATE_KEY: ((ssm:/$SERVICE_NAME/ASAP_PRIVATE_KEY))"
  echo ""
  exit 1
fi

# Check if service exists in this env. Note: a service with deployments in
# *another* env (e.g. pdev-west2) but never deployed to $ENV will still appear
# via `service show`, but its `Deployments:` list for $ENV will be empty.
# We treat both "no service" and "service has no deployments in $ENV" as "new".
if atlas micros service show --service=$SERVICE_NAME --env=$ENV -o json 2>/dev/null \
    | python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('stacks',{}).get('$ENV') else 1)" 2>/dev/null; then
  echo "✅ Service exists in $ENV — will update existing deployment"

  # Verify the 7 required env vars are stashed in $ENV. We use `stash list` because
  # `stash get` does not exist as a subcommand. Stashes are scoped per-env, so
  # switching env (e.g. pdev-west2 -> pdev-apse2) requires re-stashing all keys.
  echo "   Checking environment variables in $ENV..."

  STASHED=$(atlas micros stash list -s "$SERVICE_NAME" -e "$ENV" 2>/dev/null || true)
  MISSING_VARS=()
  REQUIRED_VARS=("AI_GATEWAY_URL" "AI_GATEWAY_USE_CASE_ID" "AI_GATEWAY_CLOUD_ID" "AI_GATEWAY_USER_ID" "ASAP_KID" "ASAP_ISSUER" "ASAP_PRIVATE_KEY")
  for var in "${REQUIRED_VARS[@]}"; do
    if ! echo "$STASHED" | grep -qx "$var"; then
      MISSING_VARS+=("$var")
    fi
  done

  if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "⚠️  WARNING: Missing env vars in $ENV: ${MISSING_VARS[*]}"
    echo "   Stashes are per-env. If you switched envs, re-stash with the commands"
    echo "   in references/guide-manual-deployment.md (Step 3.6) targeting $ENV."
    echo "   The deployment may fail health checks if these are missing."
  else
    echo "✅ All 7 required environment variables are stashed in $ENV"
  fi
else
  echo "🆕 Service does not have a deployment in $ENV yet (first-time for this env)"
  echo ""
  echo "Steps to bootstrap $ENV:"
  echo "  1. Create the service if it doesn't exist anywhere:"
  echo "       atlas micros service create --service=$SERVICE_NAME --no-sd"
  echo "  2. Stash all 7 env vars under $ENV (see references/guide-manual-deployment.md, Step 3.6)"
  echo "       Tip: stashes from another env are NOT auto-copied — they're scoped per-env."
  echo "  3. Re-run this script: ./scripts/deploy.sh $SERVICE_NAME $VERSION $ENV"
  echo ""
  exit 1
fi

# Build Docker image
echo ""
echo "📦 Building Docker image..."
docker buildx build --platform linux/amd64 --no-cache \
  -t docker.atl-paas.net/${SERVICE_NAME}:app-${VERSION} \
  -f backend/Dockerfile . --load

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Contact repo maintainer."
  exit 1
fi

# Push image
echo ""
echo "📤 Pushing Docker image..."
docker push docker.atl-paas.net/${SERVICE_NAME}:app-${VERSION}

# Deploy
echo ""
echo "🚀 Deploying..."
export VERSION=$VERSION
atlas micros service deploy \
  --service=$SERVICE_NAME \
  --env=$ENV \
  --file=service-descriptor.yml

echo ""
echo "✅ Deployment initiated!"
echo ""
# Region hint based on $ENV. Both pdev envs follow the same DNS pattern:
#   https://<service>.<aws-region>.platdev.atl-paas.net
case "$ENV" in
  pdev-west2)  REGION="us-west-2" ;;
  pdev-apse2)  REGION="ap-southeast-2" ;;
  *)           REGION="<aws-region>" ;;
esac
echo "Your service URL will be (internal — needs Atlassian VPN):"
echo "  https://$SERVICE_NAME.$REGION.platdev.atl-paas.net"
echo ""
echo "Note: Micros API may show CREATE_IN_PROGRESS for 1–3 min after CFN finishes."
echo "If you want ground truth, check AWS directly:"
echo "  aws cloudformation describe-stacks --region $REGION \\"
echo "    --stack-name vpk-awake--$ENV--... --query 'Stacks[].StackStatus'"
