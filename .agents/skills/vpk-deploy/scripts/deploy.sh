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
ENV=${3:-pdev-west2}

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

# Check if service exists
if atlas micros service show --service=$SERVICE_NAME --env=$ENV 2>/dev/null; then
  echo "✅ Service exists - will update existing deployment"

  # For existing services, verify environment variables are set
  echo "   Checking environment variables..."

  MISSING_VARS=()
  REQUIRED_VARS=("AI_GATEWAY_URL" "AI_GATEWAY_USE_CASE_ID" "AI_GATEWAY_CLOUD_ID" "AI_GATEWAY_USER_ID" "ASAP_PRIVATE_KEY")

  for var in "${REQUIRED_VARS[@]}"; do
    if ! atlas micros stash get -s $SERVICE_NAME -e $ENV -k $var &>/dev/null 2>&1; then
      MISSING_VARS+=("$var")
    fi
  done

  if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "⚠️  WARNING: Missing environment variables: ${MISSING_VARS[*]}"
    echo "   The deployment may fail. See references/guide-manual-deployment.md for setup."
  else
    echo "✅ All required environment variables are set"
  fi
else
  echo "🆕 Service does not exist yet"
  echo ""
  echo "For first-time deployment, you must first:"
  echo "  1. Create the service:  atlas micros service create --service=$SERVICE_NAME --no-sd"
  echo "  2. Set environment variables (see references/guide-manual-deployment.md)"
  echo "  3. Run this script again"
  echo ""
  echo "Quick setup:"
  echo "  atlas micros service create --service=$SERVICE_NAME --no-sd"
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
echo "Your service URL will be:"
echo "https://$SERVICE_NAME.us-west-2.platdev.atl-paas.net"
