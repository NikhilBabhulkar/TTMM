// ============================================================================
// Global Error Handler Middleware
// ============================================================================
// Centralized error handling for consistent error responses
// Handles validation errors, authentication errors, database errors, etc.
// ============================================================================

const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Write error logs to file
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs to combined file
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

/**
 * Global error handler middleware
 * Catches all errors and returns consistent JSON responses
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorType = err.name || 'Error';
  let details = null;

  // Log error with context
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?.userId,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  
  // 1. Validation errors (express-validator)
  if (err.name === 'ValidationError' || err.errors) {
    statusCode = 400;
    errorType = 'ValidationError';
    message = 'Validation failed';
    details = err.errors || err.details;
  }

  // 2. Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    errorType = 'ValidationError';
    message = 'Database validation failed';
    details = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
  }

  // 3. Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    errorType = 'ConflictError';
    message = 'Resource already exists';
    details = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // 4. Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    errorType = 'ReferenceError';
    message = 'Invalid reference to related resource';
  }

  // 5. Sequelize database connection errors
  if (err.name === 'SequelizeConnectionError') {
    statusCode = 503;
    errorType = 'DatabaseError';
    message = 'Database connection failed';
  }

  // 6. JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorType = 'AuthenticationError';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorType = 'AuthenticationError';
    message = 'Authentication token has expired';
  }

  // 7. Multer errors (file upload)
  if (err.name === 'MulterError') {
    statusCode = 400;
    errorType = 'FileUploadError';
    message = err.message;
  }

  // 8. Syntax errors (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    errorType = 'SyntaxError';
    message = 'Invalid JSON in request body';
  }

  // Don't expose internal error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Build error response
  const errorResponse = {
    error: errorType,
    message: message,
    statusCode: statusCode,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  // Add details if available and not in production
  if (details && !isProduction) {
    errorResponse.details = details;
  }

  // Add stack trace in development
  if (!isProduction && err.stack) {
    errorResponse.stack = err.stack.split('\n');
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 * 
 * Usage:
 * router.get('/route', asyncHandler(async (req, res) => {
 *   // async code here
 * }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create custom error
 * Helper function to create errors with specific status codes
 * 
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error} - Error object with statusCode property
 */
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = errorHandler;
module.exports.asyncHandler = asyncHandler;
module.exports.createError = createError;
module.exports.logger = logger;
