// ============================================================================
// Authentication Controller
// ============================================================================
// Handles user registration and login
// Implements JWT-based authentication with bcrypt password hashing
// ============================================================================

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../models');

// Number of salt rounds for bcrypt (10 is recommended for production)
const SALT_ROUNDS = 10;

// JWT secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Register a new user
 * POST /register
 * 
 * Request body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "SecurePass123"
 * }
 * 
 * Response:
 * {
 *   "message": "User registered successfully",
 *   "userId": "uuid"
 * }
 */
const register = async (req, res) => {
  try {
    // 1. Validate input using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // 2. Check if email already exists
    const existingUser = await db.User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Email already registered',
        message: 'A user with this email already exists'
      });
    }

    // 3. Hash password using bcrypt (10 rounds)
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Create user in database
    const user = await db.User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash
    });

    // 5. Return success response (exclude password hash)
    res.status(201).json({
      message: 'User registered successfully',
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
};

/**
 * Login user
 * POST /login
 * 
 * Request body:
 * {
 *   "email": "john@example.com",
 *   "password": "SecurePass123"
 * }
 * 
 * Response:
 * {
 *   "token": "jwt-token-here",
 *   "user": {
 *     "id": "uuid",
 *     "name": "John Doe",
 *     "email": "john@example.com"
 *   }
 * }
 */
const login = async (req, res) => {
  try {
    // 1. Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // 2. Find user by email (include password hash for comparison)
    const user = await db.User.scope('withPassword').findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // 3. Compare password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // 4. Generate JWT token (payload: userId, email)
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN
      }
    );

    // 5. Return token and user info (exclude password hash)
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
};

/**
 * Get current user profile
 * GET /me
 * Requires authentication
 * 
 * Response:
 * {
 *   "user": {
 *     "id": "uuid",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "created_at": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 */
const getCurrentUser = async (req, res) => {
  try {
    // User is already attached to req by authMiddleware
    const user = await db.User.findByPk(req.user.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account no longer exists'
      });
    }

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: 'An error occurred while fetching user data'
    });
  }
};

/**
 * Verify JWT token (utility function)
 * Used by authMiddleware
 * 
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 * @throws {Error} - If token is invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  verifyToken
};
