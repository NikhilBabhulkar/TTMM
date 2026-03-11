-- ============================================================================
-- Expense Sharing Application - Sample Seed Data
-- ============================================================================
-- This file contains sample data for testing and development
-- Run this after creating the schema to populate the database with test data
-- ============================================================================

-- Clear existing data (in reverse order of dependencies)
DELETE FROM balances;
DELETE FROM expense_splits;
DELETE FROM expenses;
DELETE FROM group_members;
DELETE FROM groups;
DELETE FROM users;

-- ============================================================================
-- SAMPLE USERS
-- ============================================================================
-- Password for all users: "Password123" (hashed with bcrypt)
-- Hash: $2b$10$rKZLvXF5h8F5h8F5h8F5h.5h8F5h8F5h8F5h8F5h8F5h8F5h8F5h8
-- Note: In production, use actual bcrypt hashes
-- ============================================================================

INSERT INTO users (id, name, email, password_hash, created_at) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Alice Smith', 'alice@example.com', '$2b$10$rKZLvXF5h8F5h8F5h8F5h.5h8F5h8F5h8F5h8F5h8F5h8F5h8F5h8', '2024-01-01 10:00:00'),
    ('22222222-2222-2222-2222-222222222222', 'Bob Jones', 'bob@example.com', '$2b$10$rKZLvXF5h8F5h8F5h8F5h.5h8F5h8F5h8F5h8F5h8F5h8F5h8F5h8', '2024-01-02 11:00:00'),
    ('33333333-3333-3333-3333-333333333333', 'Carol White', 'carol@example.com', '$2b$10$rKZLvXF5h8F5h8F5h8F5h.5h8F5h8F5h8F5h8F5h8F5h8F5h8F5h8', '2024-01-03 12:00:00'),
    ('44444444-4444-4444-4444-444444444444', 'David Brown', 'david@example.com', '$2b$10$rKZLvXF5h8F5h8F5h8F5h.5h8F5h8F5h8F5h8F5h8F5h8F5h8F5h8', '2024-01-04 13:00:00'),
    ('55555555-5555-5555-5555-555555555555', 'Eve Davis', 'eve@example.com', '$2b$10$rKZLvXF5h8F5h8F5h8F5h.5h8F5h8F5h8F5h8F5h8F5h8F5h8F5h8', '2024-01-05 14:00:00');

-- ============================================================================
-- SAMPLE GROUPS
-- ============================================================================
-- Create test groups for different scenarios
-- ============================================================================

INSERT INTO groups (id, name, created_by, created_at) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Weekend Trip', '11111111-1111-1111-1111-111111111111', '2024-01-10 10:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Roommates', '22222222-2222-2222-2222-222222222222', '2024-01-11 11:00:00'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Office Lunch', '33333333-3333-3333-3333-333333333333', '2024-01-12 12:00:00');

-- ============================================================================
-- SAMPLE GROUP MEMBERS
-- ============================================================================
-- Add users to groups
-- ============================================================================

-- Weekend Trip group: Alice (creator), Bob, Carol
INSERT INTO group_members (id, group_id, user_id, joined_at) VALUES
    ('11111111-aaaa-aaaa-aaaa-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '2024-01-10 10:00:00'),
    ('22222222-aaaa-aaaa-aaaa-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '2024-01-10 10:05:00'),
    ('33333333-aaaa-aaaa-aaaa-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', '2024-01-10 10:10:00');

-- Roommates group: Bob (creator), Carol, David
INSERT INTO group_members (id, group_id, user_id, joined_at) VALUES
    ('22222222-bbbb-bbbb-bbbb-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '2024-01-11 11:00:00'),
    ('33333333-bbbb-bbbb-bbbb-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', '2024-01-11 11:05:00'),
    ('44444444-bbbb-bbbb-bbbb-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', '2024-01-11 11:10:00');

-- Office Lunch group: Carol (creator), David, Eve
INSERT INTO group_members (id, group_id, user_id, joined_at) VALUES
    ('33333333-cccc-cccc-cccc-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', '2024-01-12 12:00:00'),
    ('44444444-cccc-cccc-cccc-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', '2024-01-12 12:05:00'),
    ('55555555-cccc-cccc-cccc-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555', '2024-01-12 12:10:00');

-- ============================================================================
-- SAMPLE EXPENSES
-- ============================================================================
-- Create test expenses with different scenarios
-- ============================================================================

-- Expense 1: Alice pays ₹3000 for dinner in Weekend Trip group
INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at) VALUES
    ('e1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 3000.00, 'Dinner at restaurant', '2024-01-15 20:00:00');

-- Expense 2: Bob pays ₹1500 for movie tickets in Weekend Trip group
INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at) VALUES
    ('e2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 1500.00, 'Movie tickets', '2024-01-16 18:00:00');

-- Expense 3: Carol pays ₹6000 for rent in Roommates group
INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at) VALUES
    ('e3333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 6000.00, 'Monthly rent', '2024-01-20 09:00:00');

-- Expense 4: David pays ₹450 for lunch in Office Lunch group
INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at) VALUES
    ('e4444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', 450.00, 'Team lunch', '2024-01-22 13:00:00');

-- ============================================================================
-- SAMPLE EXPENSE SPLITS
-- ============================================================================
-- Define how each expense is split among group members
-- ============================================================================

-- Expense 1 splits: ₹3000 split equally among Alice, Bob, Carol (₹1000 each)
INSERT INTO expense_splits (id, expense_id, user_id, amount) VALUES
    ('s1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1000.00),
    ('s1111111-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 1000.00),
    ('s1111111-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 1000.00);

-- Expense 2 splits: ₹1500 split equally among Alice, Bob, Carol (₹500 each)
INSERT INTO expense_splits (id, expense_id, user_id, amount) VALUES
    ('s2222222-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 500.00),
    ('s2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 500.00),
    ('s2222222-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 500.00);

-- Expense 3 splits: ₹6000 split equally among Bob, Carol, David (₹2000 each)
INSERT INTO expense_splits (id, expense_id, user_id, amount) VALUES
    ('s3333333-2222-2222-2222-222222222222', 'e3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 2000.00),
    ('s3333333-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 2000.00),
    ('s3333333-4444-4444-4444-444444444444', 'e3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 2000.00);

-- Expense 4 splits: ₹450 split equally among Carol, David, Eve (₹150 each)
INSERT INTO expense_splits (id, expense_id, user_id, amount) VALUES
    ('s4444444-3333-3333-3333-333333333333', 'e4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 150.00),
    ('s4444444-4444-4444-4444-444444444444', 'e4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 150.00),
    ('s4444444-5555-5555-5555-555555555555', 'e4444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 150.00);

-- ============================================================================
-- SAMPLE BALANCES
-- ============================================================================
-- Calculate and insert initial balances based on the expenses above
-- ============================================================================

-- Alice's balance:
-- Paid: ₹3000 (Expense 1)
-- Own splits: ₹1000 (from Expense 1) + ₹500 (from Expense 2) = ₹1500
-- amount_due = 3000 - 1000 = ₹2000 (others owe her)
-- amount_owed = ₹500 (she owes Bob for Expense 2)
INSERT INTO balances (id, user_id, amount_owed, amount_due, updated_at) VALUES
    ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 500.00, 2000.00, CURRENT_TIMESTAMP);

-- Bob's balance:
-- Paid: ₹1500 (Expense 2)
-- Own splits: ₹1000 (Expense 1) + ₹500 (Expense 2) + ₹2000 (Expense 3) = ₹3500
-- amount_due = 1500 - 500 = ₹1000 (others owe him)
-- amount_owed = ₹1000 (Expense 1 from Alice) + ₹2000 (Expense 3 from Carol) = ₹3000
INSERT INTO balances (id, user_id, amount_owed, amount_due, updated_at) VALUES
    ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 3000.00, 1000.00, CURRENT_TIMESTAMP);

-- Carol's balance:
-- Paid: ₹6000 (Expense 3)
-- Own splits: ₹1000 (Expense 1) + ₹500 (Expense 2) + ₹2000 (Expense 3) + ₹150 (Expense 4) = ₹3650
-- amount_due = 6000 - 2000 = ₹4000 (others owe her)
-- amount_owed = ₹1000 (Expense 1) + ₹500 (Expense 2) + ₹150 (Expense 4) = ₹1650
INSERT INTO balances (id, user_id, amount_owed, amount_due, updated_at) VALUES
    ('b3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 1650.00, 4000.00, CURRENT_TIMESTAMP);

-- David's balance:
-- Paid: ₹450 (Expense 4)
-- Own splits: ₹2000 (Expense 3) + ₹150 (Expense 4) = ₹2150
-- amount_due = 450 - 150 = ₹300 (others owe him)
-- amount_owed = ₹2000 (Expense 3 from Carol)
INSERT INTO balances (id, user_id, amount_owed, amount_due, updated_at) VALUES
    ('b4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 2000.00, 300.00, CURRENT_TIMESTAMP);

-- Eve's balance:
-- Paid: ₹0
-- Own splits: ₹150 (Expense 4)
-- amount_due = ₹0
-- amount_owed = ₹150 (Expense 4 from David)
INSERT INTO balances (id, user_id, amount_owed, amount_due, updated_at) VALUES
    ('b5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 150.00, 0.00, CURRENT_TIMESTAMP);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the seed data was inserted correctly
-- ============================================================================

-- Count records in each table
-- SELECT 'users' as table_name, COUNT(*) as count FROM users
-- UNION ALL
-- SELECT 'groups', COUNT(*) FROM groups
-- UNION ALL
-- SELECT 'group_members', COUNT(*) FROM group_members
-- UNION ALL
-- SELECT 'expenses', COUNT(*) FROM expenses
-- UNION ALL
-- SELECT 'expense_splits', COUNT(*) FROM expense_splits
-- UNION ALL
-- SELECT 'balances', COUNT(*) FROM balances;

-- View all users
-- SELECT id, name, email FROM users;

-- View all groups with creator names
-- SELECT g.id, g.name, u.name as creator 
-- FROM groups g 
-- JOIN users u ON g.created_by = u.id;

-- View group memberships
-- SELECT g.name as group_name, u.name as member_name 
-- FROM group_members gm
-- JOIN groups g ON gm.group_id = g.id
-- JOIN users u ON gm.user_id = u.id
-- ORDER BY g.name, u.name;

-- View all expenses with details
-- SELECT e.description, e.amount, u.name as paid_by, g.name as group_name
-- FROM expenses e
-- JOIN users u ON e.paid_by = u.id
-- JOIN groups g ON e.group_id = g.id
-- ORDER BY e.created_at;

-- View expense splits
-- SELECT e.description, u.name as user_name, es.amount as split_amount
-- FROM expense_splits es
-- JOIN expenses e ON es.expense_id = e.id
-- JOIN users u ON es.user_id = u.id
-- ORDER BY e.description, u.name;

-- View user balances
-- SELECT u.name, b.amount_owed, b.amount_due, 
--        (b.amount_due - b.amount_owed) as net_balance
-- FROM balances b
-- JOIN users u ON b.user_id = u.id
-- ORDER BY u.name;

-- ============================================================================
-- BALANCE CALCULATION EXPLANATION
-- ============================================================================
--
-- Example: Alice's balance calculation
--
-- 1. Expenses Alice paid:
--    - Expense 1: ₹3000 (Dinner)
--    Total paid: ₹3000
--
-- 2. Alice's own splits from expenses she paid:
--    - Expense 1: ₹1000 (her share of dinner)
--    Total own splits: ₹1000
--
-- 3. Amount others owe Alice (amount_due):
--    = Total paid - Own splits
--    = ₹3000 - ₹1000 = ₹2000
--
-- 4. Alice's splits from expenses others paid:
--    - Expense 2: ₹500 (Bob paid for movies)
--    Total owed: ₹500
--
-- 5. Amount Alice owes others (amount_owed):
--    = ₹500
--
-- 6. Net balance:
--    = amount_due - amount_owed
--    = ₹2000 - ₹500 = ₹1500 (Alice is owed ₹1500 overall)
--
-- ============================================================================
