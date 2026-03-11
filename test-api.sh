#!/bin/bash

# ============================================================================
# API Testing Script
# ============================================================================
# Quick script to test all main API endpoints
# Usage: ./test-api.sh
# ============================================================================

echo "🧪 Testing Expense Sharing API"
echo "================================"
echo ""

BASE_URL="http://localhost:5000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local token=$5
    
    echo -n "Testing: $name ... "
    
    if [ -z "$token" ]; then
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\n%{http_code}")
    else
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data" \
            -w "\n%{http_code}")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        echo "$body" | head -c 100
        echo ""
        echo ""
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        FAILED=$((FAILED + 1))
        echo "$body"
        echo ""
    fi
}

# Test 1: Health Check
echo "1. Health Check"
test_endpoint "Health endpoint" "GET" "/health" "" ""

# Test 2: Login
echo "2. Authentication"
login_response=$(curl -s -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"alice@example.com","password":"Password123"}')

TOKEN=$(echo $login_response | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Login failed - cannot continue tests${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Login successful${NC}"
    echo "Token: ${TOKEN:0:50}..."
    echo ""
    PASSED=$((PASSED + 1))
fi

# Test 3: Get Current User
echo "3. User Profile"
test_endpoint "Get current user" "GET" "/me" "" "$TOKEN"

# Test 4: Get All Users
echo "4. User List"
test_endpoint "Get all users" "GET" "/users" "" "$TOKEN"

# Test 5: Get User Groups
echo "5. User Groups"
test_endpoint "Get user groups" "GET" "/groups" "" "$TOKEN"

# Test 6: Get User Balance
echo "6. User Balance"
test_endpoint "Get user balance" "GET" "/balances/me" "" "$TOKEN"

# Summary
echo "================================"
echo "Test Summary:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "🎉 Your API is working correctly!"
    echo ""
    echo "Next steps:"
    echo "1. Open http://localhost:3000 in your browser"
    echo "2. Login with: alice@example.com / Password123"
    echo "3. Test the UI features"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo "Check the errors above and fix them"
    exit 1
fi
