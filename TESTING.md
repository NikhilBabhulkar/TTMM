# 🧪 Testing Guide

Complete guide for testing the Expense Sharing Application.

## Testing Strategy

This application uses multiple testing approaches:
1. **Manual Testing** - User interface and workflows
2. **API Testing** - Backend endpoints with Postman/curl
3. **Unit Tests** - Individual functions and components
4. **Integration Tests** - Full workflows
5. **Property-Based Tests** - Universal correctness properties (optional)

## 1. Manual Testing

### Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- Database set up with sample data

### Test Scenarios

#### Scenario 1: User Registration and Login

**Steps:**
1. Go to `http://localhost:3000/signup`
2. Fill in registration form:
   - Name: Test User
   - Email: test@example.com
   - Password: Test123456
3. Click "Sign Up"
4. Verify redirect to login page
5. Login with same credentials
6. Verify redirect to dashboard

**Expected Results:**
- ✅ Registration succeeds
- ✅ User can login
- ✅ Dashboard displays user name
- ✅ Balance shows ₹0.00

#### Scenario 2: Create Group

**Steps:**
1. Login to dashboard
2. Click "Create Group"
3. Enter group name: "Test Group"
4. Search and select 1-2 members
5. Click "Create Group"

**Expected Results:**
- ✅ Group created successfully
- ✅ Redirect to group detail page
- ✅ Group shows creator and selected members
- ✅ No expenses yet

#### Scenario 3: Add Expense with Equal Split

**Steps:**
1. Go to a group detail page
2. Click "Add Expense"
3. Fill in expense form:
   - Amount: 3000
   - Description: Dinner
   - Paid by: You
   - Split type: Equal
4. Click "Create Expense"

**Expected Results:**
- ✅ Expense created successfully
- ✅ Redirect to group detail page
- ✅ Expense appears in list
- ✅ Balance updated on dashboard

#### Scenario 4: Add Expense with Custom Split

**Steps:**
1. Go to a group detail page
2. Click "Add Expense"
3. Fill in expense form:
   - Amount: 3000
   - Description: Shopping
   - Paid by: You
   - Split type: Custom
   - Member 1: 1000
   - Member 2: 2000
4. Click "Create Expense"

**Expected Results:**
- ✅ Expense created successfully
- ✅ Custom splits saved correctly
- ✅ Balance reflects custom split amounts

#### Scenario 5: View Balance Details

**Steps:**
1. Go to dashboard
2. Click "View Details" on balance card
3. Review balance breakdown

**Expected Results:**
- ✅ Shows total amount owed
- ✅ Shows total amount due
- ✅ Shows net balance
- ✅ Shows detailed breakdown by person

#### Scenario 6: Delete Expense

**Steps:**
1. Go to a group detail page
2. Click "Delete" on an expense
3. Confirm deletion

**Expected Results:**
- ✅ Expense deleted
- ✅ Expense removed from list
- ✅ Balance recalculated

### Edge Cases to Test

1. **Invalid Registration:**
   - Weak password (no uppercase/number)
   - Invalid email format
   - Duplicate email

2. **Invalid Login:**
   - Wrong password
   - Non-existent email

3. **Invalid Expense:**
   - Negative amount
   - Empty description
   - Custom splits don't sum to total

4. **Authorization:**
   - Try accessing protected routes without login
   - Try deleting someone else's expense

## 2. API Testing with curl

### Authentication

**Register:**
```bash
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test User",
    "email": "apitest@example.com",
    "password": "Test123456"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@example.com",
    "password": "Test123456"
  }'
```

Save the token from response for subsequent requests.

### Protected Endpoints

**Get Current User:**
```bash
curl -X GET http://localhost:5000/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get All Users:**
```bash
curl -X GET http://localhost:5000/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Create Group:**
```bash
curl -X POST http://localhost:5000/groups \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Group"
  }'
```

**Create Expense:**
```bash
curl -X POST http://localhost:5000/expenses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": "GROUP_ID_HERE",
    "paid_by": "USER_ID_HERE",
    "amount": 3000,
    "description": "API Test Expense",
    "split_type": "equal"
  }'
```

**Get Balance:**
```bash
curl -X GET http://localhost:5000/balances/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 3. Automated Tests

### Backend Unit Tests

```bash
cd backend
npm test
```

**Test Coverage:**
- Model validations
- Controller logic
- Middleware functions
- Error handling
- Balance calculations

### Frontend Unit Tests

```bash
cd frontend
npm test
```

**Test Coverage:**
- Component rendering
- Form validation
- API service calls
- Authentication flow

## 4. Integration Testing

### Full User Flow Test

**Script:** `backend/tests/integration/user-flow.test.js`

Tests complete user journey:
1. Register → Login → Create Group → Add Expense → Check Balance

Run with:
```bash
cd backend
npm test -- --testPathPattern=integration
```

## 5. Load Testing (Optional)

### Using Apache Bench

**Test login endpoint:**
```bash
ab -n 1000 -c 10 -p login.json -T application/json \
  http://localhost:5000/login
```

**login.json:**
```json
{
  "email": "test@example.com",
  "password": "Test123456"
}
```

### Expected Performance
- Response time: < 100ms (95th percentile)
- Throughput: > 100 requests/second
- Error rate: < 1%

## 6. Security Testing

### Test Cases

1. **SQL Injection:**
   ```bash
   # Try SQL injection in login
   curl -X POST http://localhost:5000/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com OR 1=1--",
       "password": "anything"
     }'
   ```
   Expected: Should fail safely, no SQL error exposed

2. **XSS Attack:**
   ```bash
   # Try XSS in group name
   curl -X POST http://localhost:5000/groups \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "<script>alert(\"XSS\")</script>"
     }'
   ```
   Expected: Script should be escaped/sanitized

3. **JWT Tampering:**
   ```bash
   # Try accessing with invalid token
   curl -X GET http://localhost:5000/me \
     -H "Authorization: Bearer invalid_token_here"
   ```
   Expected: 401 Unauthorized

4. **Rate Limiting:**
   ```bash
   # Send 150 requests rapidly to auth endpoint
   for i in {1..150}; do
     curl -X POST http://localhost:5000/login \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com","password":"wrong"}' &
   done
   ```
   Expected: After 100 requests, should return 429 Too Many Requests

## 7. Database Testing

### Test Data Integrity

**Check balance calculation:**
```sql
-- Connect to database
psql -U postgres -d expense_sharing_db

-- Verify balance calculation
SELECT 
  u.name,
  b.amount_owed,
  b.amount_due,
  (b.amount_due - b.amount_owed) as net_balance
FROM users u
LEFT JOIN balances b ON u.id = b.user_id;

-- Verify expense splits sum to total
SELECT 
  e.id,
  e.amount as total_amount,
  SUM(es.amount) as splits_sum,
  e.amount - SUM(es.amount) as difference
FROM expenses e
JOIN expense_splits es ON e.id = es.expense_id
GROUP BY e.id, e.amount
HAVING e.amount != SUM(es.amount);
```

Expected: No rows returned (all splits sum correctly)

## 8. Test Checklist

### Before Release

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing completed for all scenarios
- [ ] Security tests pass
- [ ] Performance meets requirements
- [ ] Database integrity verified
- [ ] Error handling works correctly
- [ ] Logging captures important events
- [ ] API documentation is accurate
- [ ] Frontend handles all error states
- [ ] Mobile responsiveness tested
- [ ] Cross-browser compatibility checked

## 9. Continuous Testing

### Pre-commit Checks
```bash
# Run before committing code
npm test
npm run lint
```

### CI/CD Pipeline Tests
- Automated tests run on every push
- Deployment blocked if tests fail
- Coverage reports generated

## 10. Debugging Tips

### Backend Issues

**Enable debug logging:**
```bash
# In backend/.env
LOG_LEVEL=debug
```

**Check logs:**
```bash
tail -f backend/logs/app.log
```

### Frontend Issues

**Open browser console:**
- Press F12
- Check Console tab for errors
- Check Network tab for API calls

**React DevTools:**
- Install React DevTools extension
- Inspect component state and props

### Database Issues

**Check connections:**
```bash
psql -U postgres -d expense_sharing_db -c "SELECT COUNT(*) FROM pg_stat_activity;"
```

**View recent queries:**
```sql
SELECT query, state, query_start 
FROM pg_stat_activity 
WHERE datname = 'expense_sharing_db';
```

## 11. Test Data Management

### Reset Database
```bash
cd backend
node scripts/setup-database.js --seed
```

### Create Custom Test Data
```javascript
// backend/scripts/create-test-data.js
// Customize this script for specific test scenarios
```

## 12. Reporting Issues

When reporting bugs, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots/logs
5. Environment (OS, browser, Node version)
6. Error messages

---

**Happy Testing! 🧪**
