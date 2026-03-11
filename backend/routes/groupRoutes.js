// ============================================================================
// Group Routes
// ============================================================================
// Routes for group management operations
// All routes require authentication
// ============================================================================

const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateGroupCreation, validateUUID, sanitizeInput } = require('../middleware/validators');

// Apply authentication middleware to all group routes
router.use(authenticateToken);

/**
 * @route   GET /groups
 * @desc    Get all groups for current user
 * @access  Private (requires authentication)
 */
router.get('/', groupController.getUserGroups);

/**
 * @route   POST /groups
 * @desc    Create a new group
 * @access  Private (requires authentication)
 * @body    { name, members? }
 */
router.post(
  '/',
  sanitizeInput,
  validateGroupCreation,
  groupController.createGroup
);

/**
 * @route   GET /groups/:id
 * @desc    Get group by ID with members
 * @access  Private (requires authentication)
 * @param   id - Group UUID
 */
router.get('/:id', validateUUID('id'), groupController.getGroupById);

/**
 * @route   POST /groups/:id/members
 * @desc    Add member to group
 * @access  Private (requires authentication)
 * @param   id - Group UUID
 * @body    { user_id }
 */
router.post(
  '/:id/members',
  validateUUID('id'),
  sanitizeInput,
  groupController.addMemberToGroup
);

/**
 * @route   DELETE /groups/:id/members/:userId
 * @desc    Remove member from group
 * @access  Private (requires authentication)
 * @param   id - Group UUID
 * @param   userId - User UUID to remove
 */
router.delete(
  '/:id/members/:userId',
  validateUUID('id'),
  validateUUID('userId'),
  groupController.removeMemberFromGroup
);

/**
 * @route   DELETE /groups/:id
 * @desc    Delete a group
 * @access  Private (requires authentication, must be group creator)
 * @param   id - Group UUID
 */
router.delete('/:id', validateUUID('id'), groupController.deleteGroup);

module.exports = router;
