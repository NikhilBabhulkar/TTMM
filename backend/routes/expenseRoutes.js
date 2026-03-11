// ============================================================================
// Expense Routes
// ============================================================================
// Routes for expense management operations
// All routes require authentication
// ============================================================================

const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateExpenseCreation, validateUUID, sanitizeInput } = require('../middleware/validators');

// Apply authentication middleware to all expense routes
router.use(authenticateToken);

/**
 * @route   POST /expenses
 * @desc    Create a new expense
 * @access  Private (requires authentication)
 * @body    { group_id, paid_by, amount, description, split_type?, splits? }
 */
router.post(
  '/',
  sanitizeInput,
  validateExpenseCreation,
  expenseController.createExpense
);

/**
 * @route   GET /expenses/group/:id
 * @desc    Get all expenses for a group
 * @access  Private (requires authentication)
 * @param   id - Group UUID
 */
router.get('/group/:id', validateUUID('id'), expenseController.getExpensesByGroup);

/**
 * @route   GET /expenses/:id
 * @desc    Get expense by ID
 * @access  Private (requires authentication)
 * @param   id - Expense UUID
 */
router.get('/:id', validateUUID('id'), expenseController.getExpenseById);

/**
 * @route   PUT /expenses/:id
 * @desc    Update an expense
 * @access  Private (requires authentication, must be payer or group creator)
 * @param   id - Expense UUID
 * @body    { amount?, description?, split_type?, splits? }
 */
router.put(
  '/:id',
  validateUUID('id'),
  sanitizeInput,
  expenseController.updateExpense
);

/**
 * @route   DELETE /expenses/:id
 * @desc    Delete an expense
 * @access  Private (requires authentication, must be payer or group creator)
 * @param   id - Expense UUID
 */
router.delete('/:id', validateUUID('id'), expenseController.deleteExpense);

module.exports = router;
