#!/bin/bash

# Test Server Script
# Runs basic health checks and API tests

API_URL="http://localhost:3001"

echo "🧪 Testing Google Ads Campaign Builder API Server"
echo "=================================================="
echo ""

# Test 1: Health Check
echo "Test 1: Health Check (GET /health)"
curl -s "$API_URL/health" | jq '.'
echo ""
echo ""

# Test 2: API Info
echo "Test 2: API Info (GET /)"
curl -s "$API_URL/" | jq '.'
echo ""
echo ""

# Test 3: Get Available Providers (requires auth)
echo "Test 3: Get Available Providers (GET /api/ai/providers)"
echo "Note: This test will fail if API_AUTH_TOKEN is not set"
if [ -z "$API_AUTH_TOKEN" ]; then
    echo "⚠️  API_AUTH_TOKEN environment variable not set"
    echo "   Set it with: export API_AUTH_TOKEN=your-token-here"
else
    curl -s "$API_URL/api/ai/providers" \
        -H "Authorization: Bearer $API_AUTH_TOKEN" | jq '.'
fi
echo ""
echo ""

echo "=================================================="
echo "✅ Tests complete!"
echo ""
echo "To run full API tests, set API_AUTH_TOKEN and use:"
echo "  export API_AUTH_TOKEN=your-token"
echo "  ./scripts/test-server.sh"
