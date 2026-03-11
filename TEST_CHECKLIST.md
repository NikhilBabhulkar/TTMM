# ✅ Testing Checklist

Use this checklist to systematically test all features of the application.

## 🔧 Pre-Testing Setup

### Step 1: Install PostgreSQL

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows:**
- Download installer from https://www.postgresql.org/download/windows/
- Run installer and follow wizard
- Start PostgreSQL service from Services

### Step 2: Verify Installation

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list                # macOS

# Test connection
psql --version
```

### Step 3: Set Up Database

```bash
cd backend
npm install
node scripts/setup-database.js --seed
```

Expected output:
```
✓ Connected to PostgreSQL
✓ Created database: expense_sharing_db
✓ Migrations completed
✓ Created 3 sample users
✓ Created sample group with members
✓ Created sample expense with splits
✅ Database setup completed successfully!
```

### Step 4: Start Backend

```bash
cd backend
npm start
```

Expected output:
```
✅ Server started successfully!
🚀 Environment: development
🌐 Server running on: http://localhost:5000
```

### Step 5: Start Frontend (New Terminal)

```bash
cd frontend
npm install
npm start
```

Browser should open at `http://localhost:3000`

---

## 📝 Feature Testing Checklist

### 1. Authentication Features

#### Test 1.1: User Registration
- [ ] Go to `http://localhost:3000/signup`
- [ ] Fill in form:
  - Name: `Test User`
  - Email: `test@example.com`
  - Password: `Test123456`
  - Confirm Password: `Test123456`
- [ ] Click "Sign Up"
- [ ] ✅ Should redirect to login page
- [ ] ✅ Should show success message

#### Test 1.2: Registration Validation
- [ ] Try weak password (e.g., `test123`)
- [ ] ✅ Should show error: "Password must contain uppercase, lowercase, and number"
- [ ] Try invalid email (e.g., `notanemail`)
- [ ] ✅ Should show error: "Invalid email format"
- [ ] Try mismatched passwords
- [ ] ✅ Should show error: "Passwords do not match"

#### Test 1.3: Duplicate Email Prevention
- [ ] Try registering with `alice@example.com` (already exists)
- [ ] ✅ Should show error: "Email already registered"

#### Test 1.4: User Login
- [ ] Go to `http://localhost:3000/login`
- [ ] Login with:
  - Email: `alice@example.com`
  - Password: `Password123`
- [ ] Click "Login"
- [ ] ✅ Should redirect to dashboard
- [ ] ✅ Should show "Welcome, Alice Johnson!"

#### Test 1.5: Invalid Login
- [ ] Try login with wrong password
- [ ] ✅ Should show error: "Invalid credentials"
- [ ] Try login with non-existent email
- [ ] ✅ Should show error: "Invalid credentials"

#### Test 1.6: Protected Routes
- [ ] Logout from dashboard
- [ ] Try accessing `http://localhost:3000/dashboard` directly
- [ ] ✅ Should redirect to login page
- [ ] Login again
- [ ] ✅ Should redirect back to dashboard

#### Test 1.7: Logout
- [ ] Click "Logout" button on dashboard
- [ ] ✅ Should redirect to login page
- [ ] Try accessing dashboard
- [ ] ✅ Should redirect to login (not authenticated)

---

### 2. Dashboard Features

#### Test 2.1: Dashboard Display
- [ ] Login as `alice@example.com`
- [ ] ✅ Should show welcome message with name
- [ ] ✅ Should show balance summary card
- [ ] ✅ Should show quick action buttons
- [ ] ✅ Should show groups list

#### Test 2.2: Balance Summary
- [ ] Check balance card on dashboard
- [ ] ✅ Should show "You owe" amount
- [ ] ✅ Should show "You are owed" amount
- [ ] ✅ Should show "Net Balance"
- [ ] ✅ Colors should be red for negative, green for positive

#### Test 2.3: Groups List
- [ ] Check groups section
- [ ] ✅ Should show "Weekend Trip" group (from seed data)
- [ ] ✅ Should show member count
- [ ] Click on group
- [ ] ✅ Should navigate to group detail page

---

### 3. Group Management Features

#### Test 3.1: Create Group
- [ ] Click "Create Group" on dashboard
- [ ] Enter group name: `Test Group`
- [ ] ✅ Should show list of all users
- [ ] Search for "bob"
- [ ] ✅ Should filter to show only Bob
- [ ] Select Bob and Charlie as members
- [ ] ✅ Should show "2 member(s) selected"
- [ ] Click "Create Group"
- [ ] ✅ Should redirect to new group detail page
- [ ] ✅ Should show 3 members (you + Bob + Charlie)

#### Test 3.2: Group Detail Page
- [ ] Go to any group detail page
- [ ] ✅ Should show group name
- [ ] ✅ Should show creator name and date
- [ ] ✅ Should show all members
- [ ] ✅ Should show expenses list (or empty state)
- [ ] ✅ Should have "Add Expense" button

#### Test 3.3: Empty Group
- [ ] Create a new group without adding members
- [ ] ✅ Should show only you as member
- [ ] ✅ Should show empty expenses state

---

### 4. Expense Management Features

#### Test 4.1: Add Expense with Equal Split
- [ ] Go to "Test Group" detail page
- [ ] Click "Add Expense"
- [ ] Fill in form:
  - Amount: `3000`
  - Description: `Dinner`
  - Paid by: You
  - Split type: Equal
- [ ] Click "Create Expense"
- [ ] ✅ Should redirect to group detail page
- [ ] ✅ Should show new expense in list
- [ ] ✅ Should show amount ₹3000.00
- [ ] ✅ Should show "Paid by [Your Name]"
- [ ] ✅ Should show "Split: Equal (3 people)"

#### Test 4.2: Add Expense with Custom Split
- [ ] Click "Add Expense" again
- [ ] Fill in form:
  - Amount: `6000`
  - Description: `Shopping`
  - Paid by: You
  - Split type: Custom
  - Your split: `2000`
  - Bob's split: `2000`
  - Charlie's split: `2000`
- [ ] ✅ Should show "Current total: ₹6000.00" in green
- [ ] Click "Create Expense"
- [ ] ✅ Should create successfully

#### Test 4.3: Custom Split Validation
- [ ] Click "Add Expense"
- [ ] Fill in:
  - Amount: `3000`
  - Split type: Custom
  - Your split: `1000`
  - Bob's split: `1000`
  - Charlie's split: `500` (total = 2500, not 3000)
- [ ] ✅ Should show total in red
- [ ] Try to submit
- [ ] ✅ Should show error: "Custom splits must equal total amount"

#### Test 4.4: Delete Expense
- [ ] Go to group detail page
- [ ] Click "Delete" on an expense
- [ ] Confirm deletion
- [ ] ✅ Should remove expense from list
- [ ] Go to dashboard
- [ ] ✅ Balance should be updated

#### Test 4.5: Expense List Display
- [ ] Go to group with expenses
- [ ] ✅ Should show all expenses
- [ ] ✅ Should show amount, description, payer
- [ ] ✅ Should show date
- [ ] ✅ Should show split type
- [ ] ✅ Should have delete button

---

### 5. Balance Features

#### Test 5.1: Balance Summary Page
- [ ] Go to dashboard
- [ ] Click "View Details" on balance card
- [ ] ✅ Should show overall net balance (large number)
- [ ] ✅ Should show "You Owe" total
- [ ] ✅ Should show "You're Owed" total
- [ ] ✅ Should show detailed breakdown by person

#### Test 5.2: Balance Calculation Accuracy
- [ ] Create a simple test:
  - Create group with Alice, Bob, Charlie
  - Alice pays ₹3000 for dinner
  - Split equally
- [ ] Check Alice's balance:
  - ✅ Amount owed: ₹0 (she paid)
  - ✅ Amount due: ₹2000 (Bob owes 1000, Charlie owes 1000)
  - ✅ Net: +₹2000
- [ ] Check Bob's balance:
  - ✅ Amount owed: ₹1000 (to Alice)
  - ✅ Amount due: ₹0
  - ✅ Net: -₹1000

#### Test 5.3: Multi-Group Balances
- [ ] Login as Alice
- [ ] Create two groups
- [ ] Add expenses in both groups
- [ ] Check balance summary
- [ ] ✅ Should aggregate across both groups

#### Test 5.4: Balance Details Breakdown
- [ ] Go to balance summary page
- [ ] ✅ Should show each person you have balance with
- [ ] ✅ Should show amount for each person
- [ ] ✅ Should show "owes you" or "you owe"
- [ ] ✅ Should use green for positive, red for negative

---

### 6. Navigation and UX

#### Test 6.1: Navigation Flow
- [ ] From dashboard → Create Group → Back to Dashboard
- [ ] ✅ All navigation should work smoothly
- [ ] From dashboard → Group Detail → Add Expense → Back to Group
- [ ] ✅ Should maintain context

#### Test 6.2: Empty States
- [ ] Create new user account
- [ ] ✅ Dashboard should show "No groups yet"
- [ ] ✅ Should show "Create Your First Group" button
- [ ] Create group
- [ ] ✅ Group detail should show "No expenses yet"

#### Test 6.3: Loading States
- [ ] Refresh any page
- [ ] ✅ Should show "Loading..." briefly
- [ ] ✅ Should load data smoothly

#### Test 6.4: Error States
- [ ] Stop backend server
- [ ] Try any action in frontend
- [ ] ✅ Should show error message
- [ ] ✅ Should not crash
- [ ] Start backend again
- [ ] ✅ Should work normally

---

### 7. Multi-User Testing

#### Test 7.1: Multiple Users Scenario
- [ ] **Alice** creates group "Roommates"
- [ ] **Alice** adds Bob and Charlie
- [ ] **Alice** adds expense: ₹3000, paid by Alice, equal split
- [ ] Logout and login as **Bob** (`bob@example.com`)
- [ ] ✅ Bob should see "Roommates" group
- [ ] ✅ Bob's balance should show he owes ₹1000
- [ ] **Bob** adds expense: ₹1500, paid by Bob, equal split
- [ ] ✅ Alice's balance should update
- [ ] ✅ Alice now owes Bob ₹500 (net)

#### Test 7.2: Cross-Group Balances
- [ ] Login as Alice
- [ ] Create "Group A" with Bob
- [ ] Add expense: ₹3000, Alice pays, equal split
- [ ] Create "Group B" with Charlie
- [ ] Add expense: ₹6000, Alice pays, equal split
- [ ] Check balance summary
- [ ] ✅ Should show Bob owes ₹1500
- [ ] ✅ Should show Charlie owes ₹3000
- [ ] ✅ Total amount due: ₹4500

---

### 8. Edge Cases and Error Handling

#### Test 8.1: Invalid Inputs
- [ ] Try creating expense with negative amount
- [ ] ✅ Should prevent or show error
- [ ] Try creating expense with empty description
- [ ] ✅ Should show error
- [ ] Try creating group with empty name
- [ ] ✅ Should show error

#### Test 8.2: Authorization
- [ ] Login as Bob
- [ ] Try to delete Alice's expense
- [ ] ✅ Should show error or prevent action

#### Test 8.3: Network Errors
- [ ] Open browser DevTools (F12)
- [ ] Go to Network tab
- [ ] Set throttling to "Slow 3G"
- [ ] Try creating expense
- [ ] ✅ Should show loading state
- [ ] ✅ Should complete eventually

---

## 🎯 Testing Summary

After completing all tests above, you should have verified:

✅ **Authentication**: Registration, login, logout, protected routes
✅ **Groups**: Create, view, member management
✅ **Expenses**: Create with equal/custom splits, view, delete
✅ **Balances**: Automatic calculation, detailed breakdown, multi-group aggregation
✅ **Security**: Input validation, authorization, error handling
✅ **UX**: Navigation, loading states, error states, empty states
✅ **Multi-user**: Concurrent users, balance updates

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

Authentication:        [ ] Pass  [ ] Fail
Group Management:      [ ] Pass  [ ] Fail
Expense Management:    [ ] Pass  [ ] Fail
Balance Calculation:   [ ] Pass  [ ] Fail
Navigation/UX:         [ ] Pass  [ ] Fail
Edge Cases:            [ ] Pass  [ ] Fail

Issues Found:
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

Overall Status:        [ ] Ready for Production  [ ] Needs Fixes
```

## 🐛 Bug Reporting Template

If you find bugs, document them like this:

```
Bug ID: #001
Title: [Short description]
Severity: Critical / High / Medium / Low

Steps to Reproduce:
1. 
2. 
3. 

Expected Behavior:


Actual Behavior:


Screenshots/Logs:


Environment:
- OS: 
- Browser: 
- Node version: 
- PostgreSQL version: 
```

---

**Happy Testing! 🧪**
