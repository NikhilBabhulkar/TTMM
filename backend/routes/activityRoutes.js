// ============================================================================
// Activity Routes
// ============================================================================
// Routes for activity log operations
// All routes require authentication
// ============================================================================

const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateUUID } = require('../middleware/validators');

// Apply authentication middleware to all activity routes
router.use(authenticateToken);

/**
 * @route   GET /activity
 * @desc    Get activity logs for current user
 * @access  Private (requires authentication)
 * @query   limit, offset, group_id
 */
router.get('/', activityController.getUserActivities);

/**
 * @route   GET /activity/group/:id
 * @desc    Get activity logs for a specific group
 * @access  Private (requires authentication and group membership)
 * @param   id - Group UUID
 * @query   limit, offset
 */
router.get('/group/:id', validateUUID('id'), activityController.getGroupActivities);

module.exports = router;
