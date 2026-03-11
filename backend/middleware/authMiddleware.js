// ============================================================================
// Authentication Middleware
// ============================================================================
// JWT validation middleware for protected routes
// Extracts and verifies JWT token from Authorization header
// ============================================================================

const jwt = require('jsonwebtoken');

// JWT secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authenticate JWT token
 * Middleware to protect routes that require authentication
 * 
 * Usage:
 * router.get('/protected', authenticateToken, controller);
 * 
 * Expected header:
 * Authorization: Bearer <jwt-token>
 * 
 * On success:
 * - Attaches decoded user data to req.user
 * - Calls next() to proceed to route handler
 * 
 * On failure:
 * - Returns 401 Unauthorized response
 */
const authenticateToken = (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No authorization header provided'
      });
    }

    // Expected format: "Bearer <token>"
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // 2. Verify token using JWT secret
    const decoded = jwt.verify(token, JWT_SECRET);

    // 3. Attach decoded user data to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    // 4. Call next() to proceed to route handler
    next();

  } catch (error) {
    // Handle different JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please login again.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid'
      });
    }

    // Generic error
    console.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Token verification failed'
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user data if token is present, but doesn't require it
 * Useful for routes that have different behavior for authenticated users
 * 
 * Usage:
 * router.get('/optional', optionalAuth, controller);
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      // No token provided, continue without user data
      req.user = null;
      return next();
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      req.user = null;
      return next();
    }

    // Try to verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();

  } catch (error) {
    // Token is invalid, but that's okay for optional auth
    req.user = null;
    next();
  }
};

/**
 * Check if user is authenticated
 * Utility function to check if request has valid user data
 * 
 * @param {Object} req - Express request object
 * @returns {boolean} - True if user is authenticated
 */
const isAuthenticated = (req) => {
  return req.user && req.user.userId;
};

module.exports = {
  authenticateToken,
  optionalAuth,
  isAuthenticated
};
