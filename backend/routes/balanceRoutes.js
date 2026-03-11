// ============================================================================
// Balance Routes
// ============================================================================
// Routes for balance calculation and retrieval
// All routes require authentication
// ============================================================================

const express = require('express');
const router = express.Router();
const balanceController = require('../controllers/balanceController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateUUID } = require('../middleware/validators');

// Apply authentication middleware to all balance routes
router.use(authenticateToken);

/**
 * @route   GET /balances/me
 * @desc    Get current user's balance
 * @access  Private (requires authentication)
 */
router.get('/me', balanceController.getCurrentUserBalance);

/**
 * @route   GET /balances/:userId
 * @desc    Get balance for a specific user
 * @access  Private (requires authentication)
 * @param   userId - User UUID
 */
router.get('/:userId', validateUUID('userId'), balanceController.getBalanceByUserId);

/**
 * @route   GET /balances/:userId/details
 * @desc    Get detailed balance breakdown for a user
 * @access  Private (requires authentication)
 * @param   userId - User UUID
 */
router.get('/:userId/details', validateUUID('userId'), balanceController.getBalanceDetails);

/**
 * @route   POST /balances/:userId/recalculate
 * @desc    Force recalculation of user's balance
 * @access  Private (requires authentication)
 * @param   userId - User UUID
 */
router.post('/:userId/recalculate', validateUUID('userId'), balanceController.recalculateBalance);

module.exports = router;
