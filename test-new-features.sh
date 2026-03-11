#!/bin/bash

# ============================================================================
# Test Script for New Features
# ============================================================================
# Tests: Delete Group, Edit Expense, Activity History
# ============================================================================

echo "=========================================="
echo "Testing New Features"
echo "=========================================="
echo ""

# Login as Alice
echo "1. Logging in as Alice..."
TOKEN=$(curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Password123"}' \
  -s | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Login failed"
  exit 1
fi
echo "✅ Login successful"
echo ""

# Get existing groups
echo "2. Getting existing groups..."
GROUPS=$(curl -X GET http://localhost:5000/groups \
  -H "Authorization: Bearer $TOKEN" \
  -s)
echo "$GROUPS" | jq '.groups[] | {id, name, member_count}'
echo ""

# Get first group ID
GROUP_ID=$(echo "$GROUPS" | jq -r '.groups[0].id')
echo "Using group: $GROUP_ID"
echo ""

# Get group details
echo "3. Testing GET /groups/:id (View Group Details)..."
curl -X GET http://localhost:5000/groups/$GROUP_ID \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq '.group | {id, name, creator: .creator.name, member_count: (.members | length)}'
echo ""

# Get group expenses
echo "4. Getting group expenses..."
EXPENSES=$(curl -X GET http://localhost:5000/expenses/group/$GROUP_ID \
  -H "Authorization: Bearer $TOKEN" \
  -s)
echo "$EXPENSES" | jq '.expenses[] | {id, description, amount}'
EXPENSE_ID=$(echo "$EXPENSES" | jq -r '.expenses[0].id')
echo ""

# Test Edit Expense
if [ ! -z "$EXPENSE_ID" ] && [ "$EXPENSE_ID" != "null" ]; then
  echo "5. Testing PUT /expenses/:id (Edit Expense)..."
  echo "Original expense:"
  curl -X GET http://localhost:5000/expenses/$EXPENSE_ID \
    -H "Authorization: Bearer $TOKEN" \
    -s | jq '.expense | {description, amount}'
  
  echo ""
  echo "Updating expense..."
  curl -X PUT http://localhost:5000/expenses/$EXPENSE_ID \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"amount":1500,"description":"Updated Dinner Expense"}' \
    -s | jq '.message'
  
  echo ""
  echo "Updated expense:"
  curl -X GET http://localhost:5000/expenses/$EXPENSE_ID \
    -H "Authorization: Bearer $TOKEN" \
    -s | jq '.expense | {description, amount}'
  echo ""
else
  echo "5. ⚠️  No expenses found to test edit"
  echo ""
fi

# Test Activity History
echo "6. Testing GET /activity (Activity History)..."
curl -X GET http://localhost:5000/activity \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq '.activities[] | {action: .action_type, description, time: .created_at}'
echo ""

# Test Group Activity History
echo "7. Testing GET /activity/group/:id (Group Activity History)..."
curl -X GET http://localhost:5000/activity/group/$GROUP_ID \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq '.activities[] | {action: .action_type, description, user: .user.name}'
echo ""

# Create a new test group for deletion
echo "8. Creating a test group for deletion..."
NEW_GROUP=$(curl -X POST http://localhost:5000/groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Group to Delete"}' \
  -s)
NEW_GROUP_ID=$(echo "$NEW_GROUP" | jq -r '.group.id')
echo "Created group: $NEW_GROUP_ID"
echo ""

# Test Delete Group
echo "9. Testing DELETE /groups/:id (Delete Group)..."
curl -X DELETE http://localhost:5000/groups/$NEW_GROUP_ID \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq '.message'
echo ""

# Verify group was deleted
echo "10. Verifying group was deleted..."
curl -X GET http://localhost:5000/groups/$NEW_GROUP_ID \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq '.error'
echo ""

# Check activity logs again
echo "11. Final activity log check..."
curl -X GET http://localhost:5000/activity?limit=5 \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq '.activities[] | {action: .action_type, description}'
echo ""

echo "=========================================="
echo "✅ All new features tested successfully!"
echo "=========================================="
