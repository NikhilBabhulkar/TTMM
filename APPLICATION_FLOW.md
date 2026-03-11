# 🔄 Application Flow Guide

Visual guide showing how data flows through the application.

## 🎯 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER JOURNEY MAP                             │
└─────────────────────────────────────────────────────────────────┘

1. REGISTRATION
   User → Signup Page → POST /register → Database
   ↓
   Password hashed with bcrypt
   ↓
   User record created
   ↓
   Redirect to Login

2. LOGIN
   User → Login Page → POST /login → Database
   ↓
   Password verified
   ↓
   JWT token generated
   ↓
   Token stored in localStorage
   ↓
   Redirect to Dashboard

3. CREATE GROUP
   User → Create Group Page → POST /groups → Database
   ↓
   Group record created
   ↓
   Creator added as first member
   ↓
   Selected members added
   ↓
   Redirect to Group Detail

4. ADD EXPENSE
   User → Add Expense Page → POST /expenses → Database
   ↓
   Expense record created
   ↓
   Splits calculated (equal or custom)
   ↓
   Split records created
   ↓
   Balances recalculated for all members
   ↓
   Redirect to Group Detail

5. VIEW BALANCE
   User → Balance Summary Page → GET /balances/:userId → Database
   ↓
   Calculate amount_owed (sum of splits where user didn't pay)
   ↓
   Calculate amount_due (sum paid - own splits)
   ↓
   Generate detailed breakdown
   ↓
   Display to user
```

## 🔐 Authentication Flow

```
┌──────────────┐
│ User enters  │
│ credentials  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ Frontend: authService.login()            │
│ - Validates input                        │
│ - Sends POST /login                      │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ Backend: authController.login()          │
│ - Finds user by email                    │
│ - Compares password with bcrypt          │
│ - Generates JWT token                    │
│ - Returns { token, user }                │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ Frontend: Store token                    │
│ - localStorage.setItem('token', token)   │
│ - localStorage.setItem('user', user)     │
│ - apiService.setAuthToken(token)         │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ All subsequent requests include:         │
│ Authorization: Bearer <token>            │
└──────────────────────────────────────────┘
```

## 💰 Expense Creation Flow

```
┌──────────────────────────────────────────┐
│ User fills expense form                  │
│ - Amount: 3000                           │
│ - Description: Dinner                    │
│ - Paid by: Alice                         │
│ - Split: Equal (3 people)                │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ Frontend: expenseService.createExpense() │
│ POST /expenses                           │
│ {                                        │
│   group_id: "uuid",                      │
│   paid_by: "alice-uuid",                 │
│   amount: 3000,                          │
│   description: "Dinner",                 │
│   split_type: "equal"                    │
│ }                                        │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ Backend: expenseController.createExpense │
│                                          │
│ Step 1: Validate input                  │
│ - Amount > 0                             │
│ - Description not empty                  │
│ - Payer is group member                  │
│                                          │
│ Step 2: Start transaction               │
│                                          │
│ Step 3: Create expense record            │
│ INSERT INTO expenses                     │
│ (id, group_id, paid_by, amount, ...)    │
│                                          │
│ Step 4: Calculate splits                 │
│ - Equal: 3000 / 3 = 1000 each            │
│                                          │
│ Step 5: Create split records             │
│ INSERT INTO expense_splits               │
│ - Alice: 1000                            │
│ - Bob: 1000                              │
│ - Charlie: 1000                          │
│                                          │
│ Step 6: Update balances                  │
│ For Alice:                               │
│   amount_due += 3000 (she paid)          │
│   amount_owed += 1000 (her split)        │
│   net = 3000 - 1000 = +2000              │
│                                          │
│ For Bob:                                 │
│   amount_owed += 1000 (his split)        │
│   net = 0 - 1000 = -1000                 │
│                                          │
│ For Charlie:                             │
│   amount_owed += 1000 (his split)        │
│   net = 0 - 1000 = -1000                 │
│                                          │
│ Step 7: Commit transaction               │
│                                          │
│ Step 8: Return success                   │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ Frontend: Redirect to group detail      │
│ - Expense appears in list                │
│ - Balance updated on dashboard           │
└──────────────────────────────────────────┘
```

## 📊 Balance Calculation Flow

```
┌──────────────────────────────────────────┐
│ User views balance                       │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ Frontend: balanceService.getDetails()    │
│ GET /balances/:userId/details            │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ Backend: Calculate balances              │
│                                          │
│ Query 1: Get all groups user belongs to │
│ SELECT * FROM group_members              │
│ WHERE user_id = 'alice-uuid'             │
│                                          │
│ Query 2: Get all expenses in those groups│
│ SELECT * FROM expenses                   │
│ WHERE group_id IN (group_ids)            │
│                                          │
│ Query 3: Get all splits for user         │
│ SELECT * FROM expense_splits             │
│ WHERE user_id = 'alice-uuid'             │
│                                          │
│ Calculate:                               │
│                                          │
│ amount_owed = SUM(                       │
│   splits where user didn't pay           │
│ )                                        │
│                                          │
│ amount_due = SUM(                        │
│   expenses paid by user                  │
│ ) - SUM(                                 │
│   user's own splits                      │
│ )                                        │
│                                          │
│ net_balance = amount_due - amount_owed   │
│                                          │
│ Generate breakdown:                      │
│ For each other user:                     │
│   - What they owe you                    │
│   - What you owe them                    │
│   - Net amount                           │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ Frontend: Display balance                │
│ - Overall net balance (big number)       │
│ - Amount owed (red)                      │
│ - Amount due (green)                     │
│ - Detailed breakdown by person           │
└──────────────────────────────────────────┘
```

## 🔄 Request/Response Flow

### Example: Create Expense

**1. Frontend Request:**
```javascript
// User clicks "Create Expense"
const expenseData = {
  group_id: "550e8400-e29b-41d4-a716-446655440000",
  paid_by: "660e8400-e29b-41d4-a716-446655440000",
  amount: 3000,
  description: "Dinner",
  split_type: "equal"
};

await expenseService.createExpense(expenseData);
```

**2. API Service (Axios):**
```javascript
// Adds Authorization header automatically
POST http://localhost:5000/expenses
Headers:
  Content-Type: application/json
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Body:
  { group_id, paid_by, amount, description, split_type }
```

**3. Backend Middleware Chain:**
```javascript
// 1. Helmet - Add security headers
// 2. CORS - Validate origin
// 3. express.json() - Parse JSON body
// 4. Morgan - Log request
// 5. authMiddleware - Verify JWT token
// 6. validators - Validate input
// 7. expenseController.createExpense - Handle request
```

**4. Backend Controller:**
```javascript
// Validate, create expense, create splits, update balances
// Use database transaction for atomicity
```

**5. Database Operations:**
```sql
BEGIN TRANSACTION;

INSERT INTO expenses (id, group_id, paid_by, amount, description, split_type)
VALUES ('uuid', 'group-uuid', 'alice-uuid', 3000, 'Dinner', 'equal');

INSERT INTO expense_splits (id, expense_id, user_id, amount)
VALUES 
  ('uuid1', 'expense-uuid', 'alice-uuid', 1000),
  ('uuid2', 'expense-uuid', 'bob-uuid', 1000),
  ('uuid3', 'expense-uuid', 'charlie-uuid', 1000);

UPDATE balances SET amount_due = amount_due + 3000 WHERE user_id = 'alice-uuid';
UPDATE balances SET amount_owed = amount_owed + 1000 WHERE user_id = 'alice-uuid';
UPDATE balances SET amount_owed = amount_owed + 1000 WHERE user_id = 'bob-uuid';
UPDATE balances SET amount_owed = amount_owed + 1000 WHERE user_id = 'charlie-uuid';

COMMIT;
```

**6. Backend Response:**
```json
{
  "message": "Expense created successfully",
  "expense": {
    "id": "expense-uuid",
    "group_id": "group-uuid",
    "paid_by": "alice-uuid",
    "amount": 3000,
    "description": "Dinner",
    "split_type": "equal",
    "created_at": "2026-03-09T10:30:00.000Z",
    "splits": [
      { "user_id": "alice-uuid", "amount": 1000 },
      { "user_id": "bob-uuid", "amount": 1000 },
      { "user_id": "charlie-uuid", "amount": 1000 }
    ]
  }
}
```

**7. Frontend Updates:**
```javascript
// Navigate to group detail page
navigate(`/groups/${groupId}`);

// Group detail page fetches updated expenses
// Dashboard balance updates on next visit
```

## 🗄️ Database State Changes

### Before Expense:
```
expenses: (empty)
expense_splits: (empty)
balances:
  Alice: amount_owed=0, amount_due=0
  Bob: amount_owed=0, amount_due=0
  Charlie: amount_owed=0, amount_due=0
```

### After Expense (₹3000, paid by Alice, equal split):
```
expenses:
  id: expense-uuid
  paid_by: alice-uuid
  amount: 3000
  description: "Dinner"

expense_splits:
  Alice: 1000
  Bob: 1000
  Charlie: 1000

balances:
  Alice: amount_owed=1000, amount_due=3000, net=+2000
  Bob: amount_owed=1000, amount_due=0, net=-1000
  Charlie: amount_owed=1000, amount_due=0, net=-1000
```

### Interpretation:
- **Alice** paid ₹3000 but only owes ₹1000 (her share)
  - She is owed ₹2000 (from Bob and Charlie)
- **Bob** owes ₹1000 to Alice
- **Charlie** owes ₹1000 to Alice

## 🔄 State Management Flow

### Frontend State:
```
App Level:
  - isAuthenticated (from localStorage)
  - Current route

Dashboard:
  - user (current user object)
  - groups (array of user's groups)
  - balance (balance summary)
  - loading (boolean)
  - error (string)

Group Detail:
  - group (group object with members)
  - expenses (array of expenses)
  - loading (boolean)
  - error (string)

Add Expense:
  - amount (number)
  - description (string)
  - paidBy (user ID)
  - splitType ('equal' or 'custom')
  - customSplits (array of {user_id, amount})
  - group (group object)
  - loading (boolean)
  - error (string)

Balance Summary:
  - balance (balance object with details)
  - currentUser (user object)
  - loading (boolean)
  - error (string)
```

## 🌐 API Request Flow

### Authenticated Request Example:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Action                                              │
│    Click "Create Group"                                     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend Component                                       │
│    groupService.createGroup({ name: "Test" })               │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. API Service (Axios)                                      │
│    - Get token from localStorage                            │
│    - Add Authorization header                               │
│    - POST http://localhost:5000/groups                      │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend Middleware                                       │
│    - Helmet (security headers)                              │
│    - CORS (validate origin)                                 │
│    - express.json() (parse body)                            │
│    - Morgan (log request)                                   │
│    - authMiddleware (verify JWT)                            │
│    - validators (validate input)                            │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Backend Controller                                       │
│    groupController.createGroup()                            │
│    - Extract user ID from JWT                               │
│    - Create group record                                    │
│    - Add creator as member                                  │
│    - Add selected members                                   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Database (PostgreSQL)                                    │
│    BEGIN TRANSACTION;                                       │
│    INSERT INTO groups (id, name, created_by) VALUES (...);  │
│    INSERT INTO group_members (group_id, user_id) VALUES (...);│
│    COMMIT;                                                  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Backend Response                                         │
│    {                                                        │
│      message: "Group created",                              │
│      group: { id, name, created_by, members: [...] }        │
│    }                                                        │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Frontend Update                                          │
│    - Receive response                                       │
│    - Navigate to /groups/:id                                │
│    - Fetch and display group details                        │
└─────────────────────────────────────────────────────────────┘
```

## 🔢 Balance Calculation Logic

### Scenario: Three Friends, Multiple Expenses

**Setup:**
- Group: Alice, Bob, Charlie
- Expense 1: ₹3000 paid by Alice, split equally
- Expense 2: ₹1500 paid by Bob, split equally

**Calculation for Alice:**
```
Expenses Alice paid:
  Expense 1: ₹3000

Alice's splits:
  Expense 1: ₹1000 (her share)
  Expense 2: ₹500 (her share)

amount_due = 3000 (what she paid)
amount_owed = 1000 + 500 = 1500 (her shares)
net_balance = 3000 - 1500 = +1500 (she is owed ₹1500)
```

**Calculation for Bob:**
```
Expenses Bob paid:
  Expense 2: ₹1500

Bob's splits:
  Expense 1: ₹1000 (his share)
  Expense 2: ₹500 (his share)

amount_due = 1500 (what he paid)
amount_owed = 1000 + 500 = 1500 (his shares)
net_balance = 1500 - 1500 = 0 (settled up)
```

**Calculation for Charlie:**
```
Expenses Charlie paid:
  (none)

Charlie's splits:
  Expense 1: ₹1000 (his share)
  Expense 2: ₹500 (his share)

amount_due = 0 (what he paid)
amount_owed = 1000 + 500 = 1500 (his shares)
net_balance = 0 - 1500 = -1500 (he owes ₹1500)
```

**Detailed Breakdown:**
```
Alice's view:
  - Bob owes you: ₹0 (he's settled)
  - Charlie owes you: ₹1500

Bob's view:
  - You owe Alice: ₹0 (settled)
  - Charlie owes you: ₹0

Charlie's view:
  - You owe Alice: ₹1000
  - You owe Bob: ₹500
```

## 🔐 Security Flow

### JWT Token Lifecycle:

```
1. LOGIN
   ↓
   Backend generates JWT:
   {
     header: { alg: "HS256", typ: "JWT" },
     payload: { userId: "uuid", email: "alice@example.com", iat: timestamp, exp: timestamp+7days },
     signature: HMACSHA256(header + payload, JWT_SECRET)
   }
   ↓
   Token sent to frontend
   ↓
   Stored in localStorage

2. SUBSEQUENT REQUESTS
   ↓
   Frontend reads token from localStorage
   ↓
   Adds to Authorization header
   ↓
   Backend verifies signature
   ↓
   Extracts user ID from payload
   ↓
   Attaches to req.user
   ↓
   Controller uses req.user.id

3. TOKEN EXPIRATION
   ↓
   Backend returns 401 Unauthorized
   ↓
   Axios interceptor catches 401
   ↓
   Clears localStorage
   ↓
   Redirects to login

4. LOGOUT
   ↓
   Frontend clears localStorage
   ↓
   Token no longer sent
   ↓
   User must login again
```

## 📱 Component Hierarchy

```
App
├── Router
    ├── Public Routes
    │   ├── LoginPage
    │   └── SignupPage
    │
    └── Private Routes (wrapped in PrivateRoute)
        ├── Dashboard
        │   ├── Balance Summary Card
        │   ├── Quick Actions
        │   └── Groups List
        │
        ├── CreateGroupPage
        │   ├── Group Name Input
        │   └── Member Selection List
        │
        ├── GroupDetailPage
        │   ├── Group Info
        │   ├── Members List
        │   └── Expenses List
        │
        ├── AddExpensePage
        │   ├── Amount Input
        │   ├── Description Input
        │   ├── Payer Selection
        │   ├── Split Type Selection
        │   └── Custom Split Inputs (conditional)
        │
        └── BalanceSummaryPage
            ├── Net Balance Display
            ├── Amount Owed Card
            ├── Amount Due Card
            └── Detailed Breakdown List
```

## 🎨 UI State Flow

### Loading States:
```
Initial → Loading → Loaded → Display Data
                  ↓
                Error → Display Error Message
```

### Form States:
```
Empty → User Input → Validation → Submit
                         ↓           ↓
                      Error      Success
                         ↓           ↓
                   Show Error   Navigate
```

### Error Recovery:
```
Error Occurs → Display Message → User Action
                                      ↓
                              Retry or Navigate Back
```

## 🔍 Debugging Flow

### When Something Goes Wrong:

```
1. Check Browser Console (F12)
   ↓
   Frontend error? → Check component code
   ↓
   API error? → Check Network tab
   ↓
   See request/response details

2. Check Backend Terminal
   ↓
   See error logs
   ↓
   Check stack trace
   ↓
   Identify failing controller/middleware

3. Check Database
   ↓
   psql -U postgres -d expense_sharing_db
   ↓
   SELECT * FROM [table];
   ↓
   Verify data integrity

4. Check Environment
   ↓
   Verify .env files
   ↓
   Check ports (5000, 3000, 5432)
   ↓
   Verify services are running
```

---

**This guide helps you understand how everything connects! 🔗**
