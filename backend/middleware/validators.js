// ============================================================================
// Input Validation Middleware
// ============================================================================
// Validation rules using express-validator
// Prevents SQL injection, XSS, and ensures data integrity
// ============================================================================

const { body, param, validationResult } = require('express-validator');

/**
 * Handle validation errors
 * Middleware to check validation results and return errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Registration validation rules
 * Validates name, email, and password for user registration
 */
const validateRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  handleValidationErrors
];

/**
 * Login validation rules
 * Validates email and password for user login
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
];

/**
 * Group creation validation rules
 * Validates group name and optional member list
 */
const validateGroupCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Group name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters'),

  body('members')
    .optional()
    .isArray()
    .withMessage('Members must be an array')
    .custom((members) => {
      if (members && members.length > 0) {
        const allUUIDs = members.every(id => 
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        );
        if (!allUUIDs) {
          throw new Error('All member IDs must be valid UUIDs');
        }
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Expense creation validation rules
 * Validates expense data including amount, description, and splits
 */
const validateExpenseCreation = [
  body('group_id')
    .notEmpty()
    .withMessage('Group ID is required')
    .isUUID()
    .withMessage('Group ID must be a valid UUID'),

  body('paid_by')
    .notEmpty()
    .withMessage('Payer ID is required')
    .isUUID()
    .withMessage('Payer ID must be a valid UUID'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0')
    .custom((value) => {
      // Check if amount has at most 2 decimal places
      const decimalPlaces = (value.toString().split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        throw new Error('Amount can have at most 2 decimal places');
      }
      return true;
    }),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Description must be between 1 and 255 characters'),

  body('split_type')
    .optional()
    .isIn(['equal', 'custom'])
    .withMessage('Split type must be either "equal" or "custom"'),

  body('splits')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Splits must be a non-empty array'),

  body('splits.*.user_id')
    .if(body('splits').exists())
    .isUUID()
    .withMessage('Each split must have a valid user ID'),

  body('splits.*.amount')
    .if(body('splits').exists())
    .isFloat({ min: 0 })
    .withMessage('Each split amount must be a non-negative number'),

  handleValidationErrors
];

/**
 * UUID parameter validation
 * Validates that route parameters are valid UUIDs
 */
const validateUUID = (paramName = 'id') => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`),

  handleValidationErrors
];

/**
 * Sanitize input to prevent XSS attacks
 * Removes potentially dangerous HTML/script tags
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize all string fields in body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remove HTML tags and script content
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]+>/g, '')
          .trim();
      }
    });
  }
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateGroupCreation,
  validateExpenseCreation,
  validateUUID,
  sanitizeInput,
  handleValidationErrors
};
