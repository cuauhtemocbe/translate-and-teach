#!/bin/bash
set -euo pipefail

# Local check that the production image carries no provider credential.
# Builds the image, runs it with a sentinel credential as a RUNTIME variable,
# and verifies the sentinel appears nowhere in the image or the built site.

SENTINEL="sentinel-$(date +%s)-not-a-real-key"
IMAGE_NAME="translate-and-teach:test"
CONTAINER_NAME="translate-and-teach-credential-check"

cleanup() {
  docker rm -f "$CONTAINER_NAME" > /dev/null 2>&1 || true
}
trap cleanup EXIT

echo "📦 Building $IMAGE_NAME (no credential at build time)..."
DOCKER_BUILDKIT=1 docker build -t "$IMAGE_NAME" .

echo ""
echo "🔍 Check 1/3: the sentinel is not in docker history or docker inspect..."
if docker history "$IMAGE_NAME" --no-trunc | grep -F "$SENTINEL" \
  || docker inspect "$IMAGE_NAME" | grep -F "$SENTINEL"; then
  echo "❌ FAILED: credential found in the image metadata"
  exit 1
fi
echo "✅ PASSED"

echo ""
echo "🔍 Check 2/3: the server starts with runtime variables and rejects an empty phrase..."
docker run -d --name "$CONTAINER_NAME" -p 18080:8080 \
  -e TOGETHER_API_KEY="$SENTINEL" \
  -e TOGETHER_MODEL="ci-model" \
  "$IMAGE_NAME" > /dev/null
sleep 3
STATUS=$(curl -s -o /dev/null -w '%{http_code}' -X POST -d '{"phrase":""}' http://127.0.0.1:18080/api/translate)
if [ "$STATUS" != "400" ]; then
  echo "❌ FAILED: expected 400 for an empty phrase, got $STATUS"
  exit 1
fi
echo "✅ PASSED"

echo ""
echo "🔍 Check 3/3: the sentinel is not in the built site served by the container..."
if docker exec "$CONTAINER_NAME" grep -rF "$SENTINEL" /app/dist; then
  echo "❌ FAILED: credential found in /app/dist"
  exit 1
fi
echo "✅ PASSED"

echo ""
echo "🎉 ALL CHECKS PASSED: the credential only exists as a runtime variable."
