#!/bin/bash
set -euo pipefail

# Local testing script for Docker builds with BuildKit secrets
# Tests that secrets are properly mounted and NOT exposed in image layers

echo "🧪 Testing Docker build with BuildKit secrets..."
echo ""

# Check if VITE_TOGETHER_API_KEY is set
if [ -z "${VITE_TOGETHER_API_KEY:-}" ]; then
  echo "❌ ERROR: VITE_TOGETHER_API_KEY environment variable is not set"
  echo "   Set it with: export VITE_TOGETHER_API_KEY='your-api-key'"
  exit 1
fi

# Check if VITE_TOGETHER_MODEL is set
if [ -z "${VITE_TOGETHER_MODEL:-}" ]; then
  echo "❌ ERROR: VITE_TOGETHER_MODEL environment variable is not set"
  echo "   Set it with: export VITE_TOGETHER_MODEL='meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'"
  exit 1
fi

IMAGE_NAME="translate-and-teach:test"

echo "📦 Building Docker image with secrets..."
echo "   Image: $IMAGE_NAME"
echo "   Model: $VITE_TOGETHER_MODEL"
echo "   API Key: ${VITE_TOGETHER_API_KEY:0:10}... (truncated)"
echo ""

# Build with BuildKit and secret mount
DOCKER_BUILDKIT=1 docker build \
  --secret id=VITE_TOGETHER_API_KEY,env=VITE_TOGETHER_API_KEY \
  --build-arg VITE_TOGETHER_MODEL="$VITE_TOGETHER_MODEL" \
  -t "$IMAGE_NAME" \
  .

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo ""
echo "✅ Build succeeded!"
echo ""

# Security audit: Check docker history for secrets
echo "🔍 Security Audit 1/3: Checking docker history for exposed secrets..."
if docker history "$IMAGE_NAME" | grep -i "together"; then
  echo "⚠️  WARNING: Found 'together' in docker history (checking if it's the API key...)"

  # More specific check for the actual API key value
  if docker history "$IMAGE_NAME" --no-trunc | grep -F "${VITE_TOGETHER_API_KEY:0:20}"; then
    echo "❌ FAILED: API key found in docker history!"
    echo "   This is a security vulnerability - secrets should not appear in image layers."
    exit 1
  else
    echo "✅ PASSED: 'together' found but API key value is NOT exposed"
  fi
else
  echo "✅ PASSED: No secrets found in docker history"
fi

echo ""

# Security audit: Check docker inspect
echo "🔍 Security Audit 2/3: Checking docker inspect for exposed secrets..."
if docker inspect "$IMAGE_NAME" | grep -F "${VITE_TOGETHER_API_KEY:0:20}"; then
  echo "❌ FAILED: API key found in docker inspect output!"
  exit 1
else
  echo "✅ PASSED: No secrets in docker inspect"
fi

echo ""

# Verify the built app exists
echo "🔍 Security Audit 3/3: Verifying build artifacts..."
docker run --rm "$IMAGE_NAME" ls -la /app/dist/ > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ PASSED: Build artifacts present in image"
else
  echo "❌ FAILED: Build artifacts not found!"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 ALL SECURITY CHECKS PASSED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Docker image built successfully with BuildKit secrets"
echo "✅ No secrets exposed in docker history"
echo "✅ No secrets exposed in docker inspect"
echo "✅ Build artifacts verified"
echo ""
echo "Image: $IMAGE_NAME"
echo ""
echo "To run the container:"
echo "  docker run -p 8080:8080 $IMAGE_NAME"
echo ""
