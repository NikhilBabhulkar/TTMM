// ============================================================================
// Authentication Routes
// ============================================================================
// Routes for user registration, login, and profile management
// ============================================================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateRegistration, validateLogin, sanitizeInput } = require('../middleware/validators');

/**
 * @route   POST /register
 * @desc    Register a new user
 * @access  Public
 * @body    { name, email, password }
 */
router.post(
  '/register',
  sanitizeInput,
  validateRegistration,
  authController.register
);

/**
 * @route   POST /login
 * @desc    Login user and get JWT token
 * @access  Public
 * @body    { email, password }
 */
router.post(
  '/login',
  sanitizeInput,
  validateLogin,
  authController.login
);

/**
 * @route   GET /me
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 */
router.get(
  '/me',
  authenticateToken,
  authController.getCurrentUser
);

module.exports = router;
