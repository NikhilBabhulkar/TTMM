// ============================================================================
// User Routes
// ============================================================================
// Routes for user profile operations
// All routes require authentication
// ============================================================================

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateUUID, sanitizeInput } = require('../middleware/validators');

// Apply authentication middleware to all user routes
router.use(authenticateToken);

/**
 * @route   GET /users
 * @desc    Get all users (public info only)
 * @access  Private (requires authentication)
 */
router.get('/', userController.getAllUsers);

/**
 * @route   GET /users/search
 * @desc    Search users by name or email
 * @access  Private (requires authentication)
 * @query   q - Search query string
 */
router.get('/search', userController.searchUsers);

/**
 * @route   GET /users/:id
 * @desc    Get user by ID
 * @access  Private (requires authentication)
 * @param   id - User UUID
 */
router.get('/:id', validateUUID('id'), userController.getUserById);

/**
 * @route   PUT /users/me
 * @desc    Update current user profile
 * @access  Private (requires authentication)
 * @body    { name }
 */
router.put('/me', sanitizeInput, userController.updateProfile);

module.exports = router;
