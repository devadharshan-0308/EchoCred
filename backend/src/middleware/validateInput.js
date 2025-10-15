import { body, param, query, validationResult } from 'express-validator';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
export const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('role')
    .optional()
    .isIn(['learner', 'issuer', 'employer', 'admin'])
    .withMessage('Invalid role'),
  handleValidationErrors
];

export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Certificate validation rules
export const validateCertificateUpload = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('issuer')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Issuer name must be between 1 and 100 characters'),
  handleValidationErrors
];

// ID parameter validation
export const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

// Query parameter validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// Employer validation rules
export const validateEmployerProfile = [
  body('companyName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Company name is required and must be less than 100 characters'),
  body('companySize')
    .optional()
    .isIn(['1-10', '11-50', '51-200', '201-1000', '1000+'])
    .withMessage('Invalid company size'),
  body('industry')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Industry must be less than 100 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  handleValidationErrors
];

// Issuer validation rules
export const validateIssuerProfile = [
  body('organizationName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Organization name is required and must be less than 100 characters'),
  body('organizationType')
    .isIn(['university', 'training_provider', 'certification_body', 'government', 'corporate'])
    .withMessage('Invalid organization type'),
  body('apiEndpoint')
    .optional()
    .isURL()
    .withMessage('Please provide a valid API endpoint URL'),
  handleValidationErrors
];

export default {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateCertificateUpload,
  validateObjectId,
  validatePagination,
  validateEmployerProfile,
  validateIssuerProfile
};
