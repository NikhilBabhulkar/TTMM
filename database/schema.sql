-- ============================================================================
-- Expense Sharing Application - Database Schema
-- ============================================================================
-- This schema defines all tables, relationships, indexes, and constraints
-- for the expense sharing application (Splitwise clone)
-- ============================================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS balances CASCADE;
DROP TABLE IF EXISTS expense_splits CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Stores user account information
-- Primary authentication and profile data
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_name_check CHECK (LENGTH(TRIM(name)) >= 2)
);

-- Index for faster email lookups during login
CREATE INDEX idx_users_email ON users(email);

-- Index for faster user searches by name
CREATE INDEX idx_users_name ON users(name);

COMMENT ON TABLE users IS 'Stores user account information including authentication credentials';
COMMENT ON COLUMN users.id IS 'Unique identifier for each user (UUID)';
COMMENT ON COLUMN users.email IS 'User email address - must be unique, used for login';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password - never store plain text passwords';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the user account was created';

-- ============================================================================
-- GROUPS TABLE
-- ============================================================================
-- Stores expense sharing groups
-- Each group can have multiple members who share expenses
-- ============================================================================

CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to users table
    CONSTRAINT fk_groups_created_by FOREIGN KEY (created_by) 
        REFERENCES users(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT groups_name_check CHECK (LENGTH(TRIM(name)) >= 1)
);

-- Index for faster lookups of groups created by a specific user
CREATE INDEX idx_groups_created_by ON groups(created_by);

-- Index for faster group name searches
CREATE INDEX idx_groups_name ON groups(name);

COMMENT ON TABLE groups IS 'Stores expense sharing groups where users can split expenses';
COMMENT ON COLUMN groups.id IS 'Unique identifier for each group (UUID)';
COMMENT ON COLUMN groups.name IS 'Display name of the group (e.g., "Weekend Trip", "Roommates")';
COMMENT ON COLUMN groups.created_by IS 'User ID of the group creator';

-- ============================================================================
-- GROUP_MEMBERS TABLE
-- ============================================================================
-- Junction table linking users to groups (many-to-many relationship)
-- Tracks which users belong to which groups
-- ============================================================================

CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_group_members_group FOREIGN KEY (group_id) 
        REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_group_members_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    
    -- Prevent duplicate memberships
    CONSTRAINT unique_group_user UNIQUE (group_id, user_id)
);

-- Index for faster lookups of all members in a group
CREATE INDEX idx_group_members_group_id ON group_members(group_id);

-- Index for faster lookups of all groups a user belongs to
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- Composite index for checking membership
CREATE INDEX idx_group_members_composite ON group_members(group_id, user_id);

COMMENT ON TABLE group_members IS 'Junction table linking users to groups (many-to-many relationship)';
COMMENT ON COLUMN group_members.group_id IS 'Reference to the group';
COMMENT ON COLUMN group_members.user_id IS 'Reference to the user who is a member';
COMMENT ON COLUMN group_members.joined_at IS 'Timestamp when the user joined the group';

-- ============================================================================
-- EXPENSES TABLE
-- ============================================================================
-- Stores expense records
-- Each expense is paid by one user and split among group members
-- ============================================================================

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL,
    paid_by UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_expenses_group FOREIGN KEY (group_id) 
        REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_expenses_paid_by FOREIGN KEY (paid_by) 
        REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Constraints
    CONSTRAINT expenses_amount_check CHECK (amount > 0),
    CONSTRAINT expenses_description_check CHECK (LENGTH(TRIM(description)) >= 1)
);

-- Index for faster lookups of all expenses in a group
CREATE INDEX idx_expenses_group_id ON expenses(group_id);

-- Index for faster lookups of all expenses paid by a user
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);

-- Index for sorting expenses by date (most recent first)
CREATE INDEX idx_expenses_created_at ON expenses(created_at DESC);

-- Composite index for group expenses sorted by date
CREATE INDEX idx_expenses_group_date ON expenses(group_id, created_at DESC);

COMMENT ON TABLE expenses IS 'Stores expense records that need to be split among group members';
COMMENT ON COLUMN expenses.id IS 'Unique identifier for each expense (UUID)';
COMMENT ON COLUMN expenses.group_id IS 'Reference to the group this expense belongs to';
COMMENT ON COLUMN expenses.paid_by IS 'User ID of the person who paid for this expense';
COMMENT ON COLUMN expenses.amount IS 'Total amount of the expense (must be positive)';
COMMENT ON COLUMN expenses.description IS 'Description of what the expense was for (e.g., "Dinner at restaurant")';

-- ============================================================================
-- EXPENSE_SPLITS TABLE
-- ============================================================================
-- Stores how each expense is split among users
-- Each row represents one person's share of an expense
-- ============================================================================

CREATE TABLE expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL,
    user_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    
    -- Foreign keys
    CONSTRAINT fk_expense_splits_expense FOREIGN KEY (expense_id) 
        REFERENCES expenses(id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_splits_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT expense_splits_amount_check CHECK (amount >= 0)
);

-- Index for faster lookups of all splits for an expense
CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);

-- Index for faster lookups of all splits for a user
CREATE INDEX idx_expense_splits_user_id ON expense_splits(user_id);

-- Composite index for checking if a user has a split in an expense
CREATE INDEX idx_expense_splits_composite ON expense_splits(expense_id, user_id);

COMMENT ON TABLE expense_splits IS 'Stores how each expense is divided among users';
COMMENT ON COLUMN expense_splits.id IS 'Unique identifier for each split (UUID)';
COMMENT ON COLUMN expense_splits.expense_id IS 'Reference to the expense being split';
COMMENT ON COLUMN expense_splits.user_id IS 'User who owes this portion of the expense';
COMMENT ON COLUMN expense_splits.amount IS 'Amount this user owes for this expense';

-- ============================================================================
-- BALANCES TABLE
-- ============================================================================
-- Stores calculated balances for each user
-- Tracks total amount owed and total amount due across all groups
-- ============================================================================

CREATE TABLE balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    amount_owed DECIMAL(10, 2) NOT NULL DEFAULT 0,
    amount_due DECIMAL(10, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    CONSTRAINT fk_balances_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT balances_amount_owed_check CHECK (amount_owed >= 0),
    CONSTRAINT balances_amount_due_check CHECK (amount_due >= 0)
);

-- Index for faster balance lookups by user
CREATE INDEX idx_balances_user_id ON balances(user_id);

COMMENT ON TABLE balances IS 'Stores calculated balances for each user across all groups';
COMMENT ON COLUMN balances.id IS 'Unique identifier for each balance record (UUID)';
COMMENT ON COLUMN balances.user_id IS 'Reference to the user (must be unique - one balance per user)';
COMMENT ON COLUMN balances.amount_owed IS 'Total amount this user owes to others';
COMMENT ON COLUMN balances.amount_due IS 'Total amount others owe to this user';
COMMENT ON COLUMN balances.updated_at IS 'Timestamp of last balance calculation';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update balances.updated_at on every update
CREATE TRIGGER update_balances_updated_at
    BEFORE UPDATE ON balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify the schema was created correctly
-- ============================================================================

-- List all tables
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- List all indexes
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';

-- List all foreign keys
-- SELECT conname, conrelid::regclass, confrelid::regclass 
-- FROM pg_constraint WHERE contype = 'f';

-- ============================================================================
-- BALANCE CALCULATION LOGIC (for reference)
-- ============================================================================
-- 
-- For a given user:
-- 
-- amount_owed = SUM of all expense_splits where:
--   - user_id = current user
--   - expense.paid_by != current user
-- 
-- amount_due = (SUM of all expenses.amount where paid_by = current user) 
--            - (SUM of expense_splits.amount where user_id = current user AND paid_by = current user)
-- 
-- Example:
-- Alice pays ₹3000 for dinner, split equally among Alice, Bob, Carol
-- 
-- Expense: amount = 3000, paid_by = Alice
-- Splits: Alice = 1000, Bob = 1000, Carol = 1000
-- 
-- Alice's balance:
--   amount_due = 3000 - 1000 = 2000 (she's owed)
--   amount_owed = 0 (she doesn't owe anyone for this expense)
-- 
-- Bob's balance:
--   amount_owed = 1000 (he owes Alice)
--   amount_due = 0 (no one owes him)
-- 
-- ============================================================================

COMMENT ON DATABASE expense_sharing IS 'Database for expense sharing application - tracks users, groups, expenses, and balances';
