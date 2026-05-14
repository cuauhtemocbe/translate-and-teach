#!/bin/bash
set -euo pipefail

# Build script that reads API key from BuildKit secret mount
# This script is called during Docker build with --mount=type=secret

echo "🔨 Starting Vite build with secrets..."

# Read API key from BuildKit secret mount
SECRET_FILE="/run/secrets/VITE_TOGETHER_API_KEY"

if [ ! -f "$SECRET_FILE" ]; then
  echo "❌ ERROR: Secret file not found at $SECRET_FILE"
  echo "   Make sure to build with: docker build --secret id=VITE_TOGETHER_API_KEY,env=VITE_TOGETHER_API_KEY"
  exit 1
fi

# Read secret and export as environment variable
export VITE_TOGETHER_API_KEY=$(cat "$SECRET_FILE")

# Verify secret is not empty
if [ -z "$VITE_TOGETHER_API_KEY" ]; then
  echo "❌ ERROR: VITE_TOGETHER_API_KEY is empty"
  exit 1
fi

# Verify VITE_TOGETHER_MODEL is set (should come from build arg)
if [ -z "${VITE_TOGETHER_MODEL:-}" ]; then
  echo "❌ ERROR: VITE_TOGETHER_MODEL is not set"
  echo "   Make sure to build with: --build-arg VITE_TOGETHER_MODEL=<model-name>"
  exit 1
fi

echo "✅ Secrets loaded successfully"
echo "   Model: $VITE_TOGETHER_MODEL"
echo "   API Key: ${VITE_TOGETHER_API_KEY:0:10}... (truncated)"

# Run typecheck and build
echo "🔍 Running typecheck..."
pnpm run typecheck

echo "📦 Building application..."
pnpm run build

echo "✅ Build completed successfully!"
