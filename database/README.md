# Database Schema Documentation

## Overview

This directory contains the database schema, migrations, and seed data for the Expense Sharing Application. The database uses PostgreSQL and is designed to efficiently track users, groups, expenses, and balances.

## Database Design

### Entity Relationship Diagram

```
users (1) ──────creates──────> (N) groups
  │                               │
  │                               │
  │ (N)                       (N) │
  │                               │
  └──────joins──────> group_members <──belongs to───┘
                          │
                          │
                      (N) │
                          │
                          ▼
                      expenses (1) ──────paid by──────> users
                          │
                          │
                      (N) │
                          │
                          ▼
                   expense_splits (N) ──────owed by──────> users
                          
users (1) ──────has──────> (1) balances
```

## Tables

### 1. users
Stores user account information and authentication credentials.

**Columns:**
- `id` (UUID, PK) - Unique identifier
- `name` (VARCHAR) - User's full name
- `email` (VARCHAR, UNIQUE) - Email address for login
- `password_hash` (VARCHAR) - Bcrypt hashed password
- `created_at` (TIMESTAMP) - Account creation timestamp

**Indexes:**
- `idx_users_email` - Fast email lookups during login
- `idx_users_name` - User search functionality

**Constraints:**
- Email must be unique
- Email must be valid format
- Name must be at least 2 characters

### 2. groups
Stores expense sharing groups.

**Columns:**
- `id` (UUID, PK) - Unique identifier
- `name` (VARCHAR) - Group display name
- `created_by` (UUID, FK → users.id) - Group creator
- `created_at` (TIMESTAMP) - Group creation timestamp

**Indexes:**
- `idx_groups_created_by` - Find groups by creator
- `idx_groups_name` - Search groups by name

**Relationships:**
- `created_by` references `users.id` (CASCADE on delete)

### 3. group_members
Junction table linking users to groups (many-to-many).

**Columns:**
- `id` (UUID, PK) - Unique identifier
- `group_id` (UUID, FK → groups.id) - Reference to group
- `user_id` (UUID, FK → users.id) - Reference to user
- `joined_at` (TIMESTAMP) - Join timestamp

**Indexes:**
- `idx_group_members_group_id` - Find all members in a group
- `idx_group_members_user_id` - Find all groups for a user
- `idx_group_members_composite` - Check membership efficiently

**Constraints:**
- `UNIQUE(group_id, user_id)` - Prevent duplicate memberships

**Relationships:**
- `group_id` references `groups.id` (CASCADE on delete)
- `user_id` references `users.id` (CASCADE on delete)

### 4. expenses
Stores expense records that need to be split.

**Columns:**
- `id` (UUID, PK) - Unique identifier
- `group_id` (UUID, FK → groups.id) - Group this expense belongs to
- `paid_by` (UUID, FK → users.id) - User who paid
- `amount` (DECIMAL) - Total expense amount
- `description` (VARCHAR) - What the expense was for
- `created_at` (TIMESTAMP) - Expense creation timestamp

**Indexes:**
- `idx_expenses_group_id` - Find expenses by group
- `idx_expenses_paid_by` - Find expenses by payer
- `idx_expenses_created_at` - Sort by date (DESC)
- `idx_expenses_group_date` - Group expenses sorted by date

**Constraints:**
- Amount must be positive (> 0)
- Description must not be empty

**Relationships:**
- `group_id` references `groups.id` (CASCADE on delete)
- `paid_by` references `users.id` (RESTRICT on delete - can't delete users with expenses)

### 5. expense_splits
Stores how each expense is divided among users.

**Columns:**
- `id` (UUID, PK) - Unique identifier
- `expense_id` (UUID, FK → expenses.id) - Reference to expense
- `user_id` (UUID, FK → users.id) - User who owes this split
- `amount` (DECIMAL) - Amount this user owes

**Indexes:**
- `idx_expense_splits_expense_id` - Find all splits for an expense
- `idx_expense_splits_user_id` - Find all splits for a user
- `idx_expense_splits_composite` - Check user's split in expense

**Constraints:**
- Amount must be non-negative (>= 0)

**Relationships:**
- `expense_id` references `expenses.id` (CASCADE on delete)
- `user_id` references `users.id` (CASCADE on delete)

### 6. balances
Stores calculated balances for each user.

**Columns:**
- `id` (UUID, PK) - Unique identifier
- `user_id` (UUID, FK → users.id, UNIQUE) - Reference to user
- `amount_owed` (DECIMAL) - Total amount user owes to others
- `amount_due` (DECIMAL) - Total amount others owe to user
- `updated_at` (TIMESTAMP) - Last calculation timestamp

**Indexes:**
- `idx_balances_user_id` - Fast balance lookups (UNIQUE)

**Constraints:**
- `user_id` must be unique (one balance per user)
- Both amounts must be non-negative (>= 0)

**Relationships:**
- `user_id` references `users.id` (CASCADE on delete)

## Balance Calculation Logic

### Formula

For a given user:

**amount_owed** (what user owes to others):
```sql
SELECT SUM(es.amount) 
FROM expense_splits es
JOIN expenses e ON es.expense_id = e.id
WHERE es.user_id = :userId 
  AND e.paid_by != :userId
```

**amount_due** (what others owe to user):
```sql
SELECT SUM(e.amount) - COALESCE(SUM(es.amount), 0)
FROM expenses e
LEFT JOIN expense_splits es ON e.id = es.expense_id 
  AND es.user_id = :userId
WHERE e.paid_by = :userId
```

### Example Calculation

**Scenario:** Alice pays ₹3000 for dinner, split equally among Alice, Bob, and Carol

**Data:**
- Expense: amount = 3000, paid_by = Alice
- Splits: Alice = 1000, Bob = 1000, Carol = 1000

**Alice's Balance:**
- amount_due = 3000 - 1000 = **₹2000** (she's owed)
- amount_owed = 0 (she doesn't owe for this expense)

**Bob's Balance:**
- amount_owed = 1000 (he owes Alice)
- amount_due = 0 (no one owes him)

**Carol's Balance:**
- amount_owed = 1000 (she owes Alice)
- amount_due = 0 (no one owes her)

## Setup Instructions

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE expense_sharing;

# Connect to the database
\c expense_sharing

# Run schema
\i database/schema.sql

# Run seeds (optional)
\i database/seeds.sql
```

### 2. Using Sequelize Migrations

```bash
cd backend

# Install Sequelize CLI globally
npm install -g sequelize-cli

# Run all migrations
npx sequelize-cli db:migrate

# Rollback last migration
npx sequelize-cli db:migrate:undo

# Rollback all migrations
npx sequelize-cli db:migrate:undo:all

# Check migration status
npx sequelize-cli db:migrate:status
```

### 3. Environment Variables

Make sure your `.env` file has the correct database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=expense_sharing
DB_USER=postgres
DB_PASSWORD=your_password
```

## Migration Files

Migrations are located in `backend/migrations/` and run in order:

1. `20240101000001-create-users.js` - Creates users table
2. `20240101000002-create-groups.js` - Creates groups table
3. `20240101000003-create-group-members.js` - Creates group_members junction table
4. `20240101000004-create-expenses.js` - Creates expenses table
5. `20240101000005-create-expense-splits.js` - Creates expense_splits table
6. `20240101000006-create-balances.js` - Creates balances table

## Seed Data

The `seeds.sql` file contains sample data:

**Users:**
- Alice Smith (alice@example.com)
- Bob Jones (bob@example.com)
- Carol White (carol@example.com)
- David Brown (david@example.com)
- Eve Davis (eve@example.com)

**Groups:**
- Weekend Trip (Alice, Bob, Carol)
- Roommates (Bob, Carol, David)
- Office Lunch (Carol, David, Eve)

**Sample Expenses:**
- Alice pays ₹3000 for dinner (Weekend Trip)
- Bob pays ₹1500 for movies (Weekend Trip)
- Carol pays ₹6000 for rent (Roommates)
- David pays ₹450 for lunch (Office Lunch)

## Verification Queries

### Check all tables exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### View all users
```sql
SELECT id, name, email, created_at FROM users;
```

### View groups with creators
```sql
SELECT g.name as group_name, u.name as creator
FROM groups g
JOIN users u ON g.created_by = u.id;
```

### View group memberships
```sql
SELECT g.name as group_name, u.name as member_name
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
JOIN users u ON gm.user_id = u.id
ORDER BY g.name, u.name;
```

### View expenses with details
```sql
SELECT 
    e.description,
    e.amount,
    u.name as paid_by,
    g.name as group_name,
    e.created_at
FROM expenses e
JOIN users u ON e.paid_by = u.id
JOIN groups g ON e.group_id = g.id
ORDER BY e.created_at DESC;
```

### View expense splits
```sql
SELECT 
    e.description as expense,
    u.name as user_name,
    es.amount as split_amount
FROM expense_splits es
JOIN expenses e ON es.expense_id = e.id
JOIN users u ON es.user_id = u.id
ORDER BY e.description, u.name;
```

### View user balances
```sql
SELECT 
    u.name,
    b.amount_owed,
    b.amount_due,
    (b.amount_due - b.amount_owed) as net_balance
FROM balances b
JOIN users u ON b.user_id = u.id
ORDER BY net_balance DESC;
```

## Performance Considerations

### Indexes
All foreign keys have indexes for fast JOIN operations:
- Users: email, name
- Groups: created_by, name
- Group Members: group_id, user_id, composite
- Expenses: group_id, paid_by, created_at, composite
- Expense Splits: expense_id, user_id, composite
- Balances: user_id (unique)

### Query Optimization Tips

1. **Use indexes** - All foreign keys are indexed
2. **Limit results** - Use LIMIT for large result sets
3. **Avoid N+1 queries** - Use JOINs instead of multiple queries
4. **Use connection pooling** - Configured in Sequelize
5. **Cache balances** - Store calculated balances in balances table

## Backup and Restore

### Backup Database
```bash
pg_dump -U postgres expense_sharing > backup.sql
```

### Restore Database
```bash
psql -U postgres expense_sharing < backup.sql
```

## Troubleshooting

### Migration fails
- Check database connection in `.env`
- Ensure PostgreSQL is running
- Verify user has CREATE TABLE permissions

### Foreign key constraint errors
- Ensure migrations run in correct order
- Check that referenced records exist
- Verify CASCADE rules are correct

### Seed data fails
- Run schema.sql first
- Check for UUID conflicts
- Verify foreign key references are valid

## Production Considerations

1. **Use environment-specific databases**
   - Development: `expense_sharing_dev`
   - Test: `expense_sharing_test`
   - Production: `expense_sharing_prod`

2. **Enable SSL connections** in production

3. **Regular backups** - Schedule automated backups

4. **Monitor performance** - Use pg_stat_statements

5. **Connection pooling** - Configure appropriate pool sizes

6. **Read replicas** - For scaling read operations

---

For more information, see the main README.md in the project root.
