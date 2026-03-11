# 🏗️ System Architecture

Detailed architecture documentation for the Expense Sharing Application.

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    Web Browser                              │    │
│  │  ┌──────────────────────────────────────────────────────┐  │    │
│  │  │           React Application (Port 3000)              │  │    │
│  │  │                                                      │  │    │
│  │  │  Components:                                         │  │    │
│  │  │  - LoginPage, SignupPage                            │  │    │
│  │  │  - Dashboard                                         │  │    │
│  │  │  - CreateGroupPage, GroupDetailPage                 │  │    │
│  │  │  - AddExpensePage, BalanceSummaryPage               │  │    │
│  │  │                                                      │  │    │
│  │  │  Services:                                           │  │    │
│  │  │  - apiService (Axios + Interceptors)                │  │    │
│  │  │  - authService, userService, groupService           │  │    │
│  │  │  - expenseService, balanceService                   │  │    │
│  │  └──────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             │ REST API
                             │ JSON
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                      APPLICATION LAYER                               │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         Node.js + Express Server (Port 5000)              │    │
│  │                                                            │    │
│  │  Middleware Stack:                                         │    │
│  │  1. Helmet (Security Headers)                             │    │
│  │  2. CORS (Cross-Origin)                                   │    │
│  │  3. express.json() (Body Parser)                          │    │
│  │  4. Morgan (Request Logger)                               │    │
│  │  5. Rate Limiter (Auth endpoints)                         │    │
│  │  6. authMiddleware (JWT Verification)                     │    │
│  │  7. Validators (Input Validation)                         │    │
│  │                                                            │    │
│  │  Controllers:                                              │    │
│  │  - authController (register, login)                       │    │
│  │  - userController (CRUD operations)                       │    │
│  │  - groupController (group management)                     │    │
│  │  - expenseController (expense + splits)                   │    │
│  │  - balanceController (balance calculation)                │    │
│  │                                                            │    │
│  │  Routes:                                                   │    │
│  │  - /register, /login, /me                                 │    │
│  │  - /users, /users/:id, /users/search                      │    │
│  │  - /groups, /groups/:id, /groups/:id/members              │    │
│  │  - /expenses, /expenses/group/:id                         │    │
│  │  - /balances/me, /balances/:userId/details                │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ SQL Queries
                             │ Sequelize ORM
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                        DATA LAYER                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │            PostgreSQL Database (Port 5432)                 │    │
│  │                                                            │    │
│  │  Tables:                                                   │    │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐          │    │
│  │  │  users   │  │  groups  │  │ group_members │          │    │
│  │  └────┬─────┘  └────┬─────┘  └───────┬───────┘          │    │
│  │       │             │                 │                   │    │
│  │       └─────────────┴─────────────────┘                   │    │
│  │                     │                                      │    │
│  │  ┌──────────┐  ┌───▼──────────┐  ┌──────────┐           │    │
│  │  │ expenses │──│expense_splits│  │ balances │           │    │
│  │  └──────────┘  └──────────────┘  └──────────┘           │    │
│  │                                                            │    │
│  │  Relationships:                                            │    │
│  │  - users → groups (created_by)                            │    │
│  │  - users → group_members (many-to-many)                   │    │
│  │  - groups → expenses (one-to-many)                        │    │
│  │  - expenses → expense_splits (one-to-many)                │    │
│  │  - users → balances (one-to-one)                          │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔄 Request Flow Example

### Creating an Expense:

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│ Frontend │────▶│ Backend  │────▶│ Database │
│          │     │          │     │          │     │          │
│ Fills    │     │ Validates│     │ Verifies │     │ Stores   │
│ form     │     │ input    │     │ JWT      │     │ data     │
│          │     │          │     │          │     │          │
│          │     │ Sends    │     │ Creates  │     │ Updates  │
│          │     │ POST     │     │ expense  │     │ balances │
│          │     │ request  │     │          │     │          │
│          │◀────│          │◀────│          │◀────│          │
│ Sees     │     │ Receives │     │ Returns  │     │ Confirms │
│ expense  │     │ response │     │ success  │     │ commit   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

## 🗂️ Code Organization

### Backend Structure:
```
backend/
├── config/
│   └── database.js          # Sequelize configuration
├── controllers/
│   ├── authController.js    # Registration, login
│   ├── userController.js    # User CRUD
│   ├── groupController.js   # Group management
│   ├── expenseController.js # Expense + splits
│   └── balanceController.js # Balance calculation
├── middleware/
│   ├── authMiddleware.js    # JWT verification
│   ├── validators.js        # Input validation
│   └── errorHandler.js      # Global error handler
├── models/
│   ├── index.js             # Sequelize init + associations
│   ├── User.js              # User model
│   ├── Group.js             # Group model
│   ├── GroupMember.js       # Membership model
│   ├── Expense.js           # Expense model
│   ├── ExpenseSplit.js      # Split model
│   └── Balance.js           # Balance model
├── routes/
│   ├── authRoutes.js        # Auth endpoints
│   ├── userRoutes.js        # User endpoints
│   ├── groupRoutes.js       # Group endpoints
│   ├── expenseRoutes.js     # Expense endpoints
│   └── balanceRoutes.js     # Balance endpoints
├── migrations/              # Database migrations
├── scripts/
│   ├── setup-database.js    # DB setup script
│   └── test-db-connection.js
├── tests/                   # Test files
├── server.js                # Entry point
└── package.json             # Dependencies
```

### Frontend Structure:
```
frontend/
├── public/
│   └── index.html           # HTML template
├── src/
│   ├── components/
│   │   └── PrivateRoute.js  # Route protection
│   ├── pages/
│   │   ├── LoginPage.js     # Login UI
│   │   ├── SignupPage.js    # Registration UI
│   │   ├── Dashboard.js     # Main dashboard
│   │   ├── CreateGroupPage.js    # Group creation
│   │   ├── GroupDetailPage.js    # Group view
│   │   ├── AddExpensePage.js     # Expense creation
│   │   └── BalanceSummaryPage.js # Balance view
│   ├── services/
│   │   ├── apiService.js    # Axios instance
│   │   ├── authService.js   # Auth operations
│   │   ├── userService.js   # User operations
│   │   ├── groupService.js  # Group operations
│   │   ├── expenseService.js # Expense operations
│   │   └── balanceService.js # Balance operations
│   ├── App.js               # Root component + routing
│   ├── App.css              # Global styles
│   └── index.js             # Entry point
└── package.json             # Dependencies
```

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
└─────────────────────────────────────────────────────────────┘

Layer 1: Network Security
  - CORS (only allow frontend origin)
  - Helmet (security headers)
  - Rate limiting (prevent brute force)

Layer 2: Authentication
  - JWT tokens (stateless auth)
  - Token expiration (7 days)
  - Secure token storage (localStorage)

Layer 3: Authorization
  - Middleware checks on all protected routes
  - User ID from JWT payload
  - Resource ownership validation

Layer 4: Input Validation
  - express-validator on all inputs
  - Type checking
  - Format validation
  - Length limits

Layer 5: Data Protection
  - Password hashing (bcrypt, 10 rounds)
  - SQL injection prevention (Sequelize ORM)
  - XSS prevention (React escaping)
  - Sensitive data exclusion (password_hash never returned)

Layer 6: Error Handling
  - No sensitive data in error messages
  - Consistent error format
  - Logging for debugging
  - Graceful degradation
```

## 💾 Data Flow

### Write Operations (Create Expense):
```
User Input
    ↓
Frontend Validation
    ↓
API Request (with JWT)
    ↓
Backend Authentication
    ↓
Backend Validation
    ↓
Database Transaction START
    ↓
Create Expense Record
    ↓
Create Split Records
    ↓
Update Balance Records
    ↓
Database Transaction COMMIT
    ↓
Return Success Response
    ↓
Frontend Update UI
```

### Read Operations (View Balance):
```
User Request
    ↓
API Request (with JWT)
    ↓
Backend Authentication
    ↓
Query Database
    ↓
Calculate Balances
    ↓
Format Response
    ↓
Return Data
    ↓
Frontend Display
```

## 🔄 State Management

### Frontend State:
```
Global State (localStorage):
  - token (JWT)
  - user (current user object)

Component State:
  - Dashboard: groups[], balance, loading, error
  - GroupDetail: group, expenses[], loading, error
  - AddExpense: form fields, group, loading, error
  - BalanceSummary: balance, details[], loading, error
```

### Backend State:
```
Stateless (no session storage)
  - All state in database
  - User identity from JWT
  - No server-side sessions
  - Horizontally scalable
```

## 🎯 Design Patterns Used

### Backend:
- **MVC Pattern**: Models, Controllers, Routes
- **Middleware Pattern**: Request processing pipeline
- **Repository Pattern**: Models abstract database access
- **Dependency Injection**: Database connection injected
- **Error Handling Pattern**: Centralized error handler

### Frontend:
- **Component Pattern**: Reusable UI components
- **Service Pattern**: API abstraction layer
- **HOC Pattern**: PrivateRoute wrapper
- **Container/Presenter**: Smart vs presentational components

### Database:
- **Normalization**: 3NF (Third Normal Form)
- **Foreign Keys**: Referential integrity
- **Indexes**: Query optimization
- **Transactions**: ACID compliance

## 🚀 Scalability Considerations

### Current Architecture:
```
Single Server Setup:
  Frontend: 1 instance
  Backend: 1 instance
  Database: 1 instance

Suitable for: Development, small teams (<100 users)
```

### Production Architecture (Future):
```
Load Balanced Setup:
  Frontend: N instances (behind CDN)
  Backend: N instances (behind load balancer)
  Database: Primary + Read Replicas

Suitable for: Production, large scale (1000+ users)
```

### Kubernetes Architecture (Task 15):
```
┌─────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                    │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────┐ │
│  │ Frontend Pods  │  │ Backend Pods   │  │ Postgres  │ │
│  │ (2-10 replicas)│  │ (2-10 replicas)│  │ StatefulSet│ │
│  └────────┬───────┘  └────────┬───────┘  └─────┬─────┘ │
│           │                   │                 │        │
│  ┌────────▼───────┐  ┌────────▼───────┐  ┌─────▼─────┐ │
│  │ Frontend Svc   │  │ Backend Svc    │  │ DB Service│ │
│  └────────┬───────┘  └────────┬───────┘  └───────────┘ │
│           │                   │                          │
│  ┌────────▼───────────────────▼────────┐                │
│  │         Ingress Controller          │                │
│  │  - Route /api → Backend             │                │
│  │  - Route / → Frontend               │                │
│  └─────────────────────────────────────┘                │
│                                                          │
│  ┌─────────────────────────────────────┐                │
│  │    Horizontal Pod Autoscaler        │                │
│  │  - Scale based on CPU/Memory        │                │
│  │  - Min: 2, Max: 10 replicas         │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

## 📊 Database Schema Relationships

```
┌─────────────┐
│    users    │
│─────────────│
│ id (PK)     │◀─────────────────────┐
│ name        │                      │
│ email       │                      │
│ password_hash│                     │
└──────┬──────┘                      │
       │                             │
       │ created_by                  │
       │                             │
┌──────▼──────┐                      │
│   groups    │                      │
│─────────────│                      │
│ id (PK)     │◀──────┐              │
│ name        │       │              │
│ created_by  │       │              │
└──────┬──────┘       │              │
       │              │              │
       │              │ group_id     │
       │              │              │
┌──────▼──────────────▼──────────────▼──┐
│        group_members                  │
│───────────────────────────────────────│
│ id (PK)                               │
│ group_id (FK → groups)                │
│ user_id (FK → users)                  │
└───────────────────────────────────────┘

┌──────▼──────┐
│  expenses   │
│─────────────│
│ id (PK)     │◀──────┐
│ group_id    │       │
│ paid_by     │       │ expense_id
│ amount      │       │
│ description │       │
└─────────────┘       │
                      │
┌─────────────────────▼──────────────┐
│       expense_splits               │
│────────────────────────────────────│
│ id (PK)                            │
│ expense_id (FK → expenses)         │
│ user_id (FK → users)               │
│ amount                             │
└────────────────────────────────────┘

┌─────────────┐
│  balances   │
│─────────────│
│ id (PK)     │
│ user_id (FK)│
│ amount_owed │
│ amount_due  │
└─────────────┘
```

## 🔐 Authentication Flow Detail

```
┌─────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION FLOW                         │
└─────────────────────────────────────────────────────────────┘

REGISTRATION:
  1. User submits: { name, email, password }
  2. Backend validates input
  3. Backend hashes password: bcrypt.hash(password, 10)
  4. Backend stores: { name, email, password_hash }
  5. Return success

LOGIN:
  1. User submits: { email, password }
  2. Backend finds user by email
  3. Backend compares: bcrypt.compare(password, password_hash)
  4. If match:
     - Generate JWT: jwt.sign({ userId, email }, SECRET, { expiresIn: '7d' })
     - Return: { token, user: { id, name, email } }
  5. Frontend stores token in localStorage
  6. Frontend adds token to all requests

PROTECTED REQUEST:
  1. Frontend reads token from localStorage
  2. Frontend adds header: Authorization: Bearer <token>
  3. Backend middleware extracts token
  4. Backend verifies: jwt.verify(token, SECRET)
  5. Backend extracts payload: { userId, email }
  6. Backend attaches to request: req.user = { id: userId, email }
  7. Controller uses req.user.id

TOKEN EXPIRATION:
  1. Token expires after 7 days
  2. Backend returns 401 Unauthorized
  3. Axios interceptor catches 401
  4. Frontend clears localStorage
  5. Frontend redirects to /login
```

## 💰 Balance Calculation Algorithm

```
┌─────────────────────────────────────────────────────────────┐
│              BALANCE CALCULATION ALGORITHM                   │
└─────────────────────────────────────────────────────────────┘

For User X:

Step 1: Find all groups user belongs to
  SELECT group_id FROM group_members WHERE user_id = X

Step 2: Find all expenses in those groups
  SELECT * FROM expenses WHERE group_id IN (group_ids)

Step 3: Find all splits for user
  SELECT * FROM expense_splits WHERE user_id = X

Step 4: Calculate amount_owed
  amount_owed = SUM(
    SELECT amount FROM expense_splits
    WHERE user_id = X
    AND expense_id IN (
      SELECT id FROM expenses WHERE paid_by != X
    )
  )
  
  Translation: Sum of all splits where user didn't pay

Step 5: Calculate amount_due
  amount_due = (
    SUM(SELECT amount FROM expenses WHERE paid_by = X)
    -
    SUM(SELECT amount FROM expense_splits WHERE user_id = X AND expense_id IN (
      SELECT id FROM expenses WHERE paid_by = X
    ))
  )
  
  Translation: Total paid minus own splits

Step 6: Calculate net balance
  net_balance = amount_due - amount_owed

Step 7: Generate detailed breakdown
  For each other user Y in same groups:
    net_with_Y = (
      amount_Y_owes_X - amount_X_owes_Y
    )
    
    If net_with_Y > 0: "Y owes you ₹net_with_Y"
    If net_with_Y < 0: "You owe Y ₹|net_with_Y|"
    If net_with_Y = 0: "Settled up with Y"
```

### Example Calculation:

**Scenario:**
- Group: Alice, Bob, Charlie
- Expense 1: ₹3000 paid by Alice, split equally
- Expense 2: ₹1500 paid by Bob, split equally

**Alice's Balance:**
```
amount_due = 3000 (she paid Expense 1)
amount_owed = 1000 (Expense 1 split) + 500 (Expense 2 split) = 1500
net_balance = 3000 - 1500 = +1500 (she is owed ₹1500)

Breakdown:
  - Bob owes Alice: 1000 (Expense 1) - 500 (Expense 2) = ₹500
  - Charlie owes Alice: 1000 (Expense 1) - 0 = ₹1000
```

**Bob's Balance:**
```
amount_due = 1500 (he paid Expense 2)
amount_owed = 1000 (Expense 1 split) + 500 (Expense 2 split) = 1500
net_balance = 1500 - 1500 = 0 (settled up)

Breakdown:
  - Alice owes Bob: 500 (Expense 2) - 1000 (Expense 1) = -₹500 (Bob owes Alice ₹500)
  - Charlie owes Bob: 500 (Expense 2)
```

**Charlie's Balance:**
```
amount_due = 0 (he paid nothing)
amount_owed = 1000 (Expense 1 split) + 500 (Expense 2 split) = 1500
net_balance = 0 - 1500 = -1500 (he owes ₹1500)

Breakdown:
  - Charlie owes Alice: ₹1000
  - Charlie owes Bob: ₹500
```

## 🎨 UI Component Hierarchy

```
App
└── Router
    ├── Public Routes
    │   ├── LoginPage
    │   │   ├── Email Input
    │   │   ├── Password Input
    │   │   ├── Submit Button
    │   │   └── Link to Signup
    │   │
    │   └── SignupPage
    │       ├── Name Input
    │       ├── Email Input
    │       ├── Password Input
    │       ├── Confirm Password Input
    │       ├── Submit Button
    │       └── Link to Login
    │
    └── Protected Routes (PrivateRoute wrapper)
        ├── Dashboard
        │   ├── Header (Welcome + Logout)
        │   ├── Balance Card
        │   │   ├── Amount Owed
        │   │   ├── Amount Due
        │   │   ├── Net Balance
        │   │   └── View Details Link
        │   ├── Quick Actions
        │   │   ├── Create Group Button
        │   │   └── Add Expense Button
        │   └── Groups List
        │       └── Group Items (clickable)
        │
        ├── CreateGroupPage
        │   ├── Group Name Input
        │   ├── Member Search
        │   ├── Member Selection List
        │   │   └── Member Items (checkboxes)
        │   ├── Create Button
        │   └── Cancel Button
        │
        ├── GroupDetailPage
        │   ├── Group Header
        │   │   ├── Group Name
        │   │   └── Creator Info
        │   ├── Members Section
        │   │   └── Member Badges
        │   ├── Action Buttons
        │   │   ├── Add Expense
        │   │   └── Back to Dashboard
        │   └── Expenses List
        │       └── Expense Items
        │           ├── Description
        │           ├── Amount
        │           ├── Payer
        │           ├── Date
        │           └── Delete Button
        │
        ├── AddExpensePage
        │   ├── Amount Input
        │   ├── Description Input
        │   ├── Payer Dropdown
        │   ├── Split Type Radio
        │   ├── Custom Split Inputs (conditional)
        │   ├── Create Button
        │   └── Cancel Button
        │
        └── BalanceSummaryPage
            ├── Net Balance Display (large)
            ├── Summary Cards
            │   ├── You Owe Card
            │   └── You're Owed Card
            ├── Detailed Breakdown
            │   └── Person Items
            │       ├── Name
            │       ├── Amount
            │       └── Direction (owes/owed)
            └── Back Button
```

## 🔧 Technology Stack Details

### Why Each Technology?

**React:**
- Component-based architecture
- Virtual DOM for performance
- Large ecosystem
- Industry standard

**Express:**
- Minimal and flexible
- Middleware pattern
- Large community
- Easy to learn

**PostgreSQL:**
- ACID compliance (critical for financial data)
- Strong consistency
- Excellent for relational data
- Mature and reliable

**Sequelize:**
- ORM abstraction
- Migration support
- SQL injection prevention
- Cross-database compatibility

**JWT:**
- Stateless authentication
- Horizontally scalable
- No server-side session storage
- Industry standard

**bcrypt:**
- Slow hashing (prevents brute force)
- Salt included automatically
- Industry standard for passwords

## 📈 Performance Characteristics

### Expected Performance:
- **API Response Time**: < 100ms (95th percentile)
- **Database Queries**: < 50ms (with indexes)
- **Frontend Load Time**: < 2s (initial load)
- **Frontend Navigation**: < 100ms (client-side routing)

### Bottlenecks:
- Database queries (mitigated with indexes)
- Balance calculation (mitigated with caching in balances table)
- Large expense lists (can add pagination)

### Optimization Strategies:
- Database indexes on foreign keys
- Eager loading with Sequelize includes
- Balance caching in database
- Frontend code splitting (future)
- CDN for static assets (future)

---

**This architecture is production-ready and follows industry best practices! 🏆**
