const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        return res.status(400).json({
            error: 'Validation Failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                location: err.location
            }))
        });
    };
};

const validationMiddleware = {
    // Common validations
    mongoId: param('id').custom(value => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('Invalid MongoDB ID');
        }
        return true;
    }),

    // User validations
    registerUser: validate([
        body('username')
            .trim()
            .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
            .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
        
        body('email')
            .trim()
            .isEmail().withMessage('Invalid email address')
            .normalizeEmail(),
        
        body('password')
            .isLength({ min: 12 }).withMessage('Password must be at least 12 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/)
            .withMessage('Password must include uppercase, lowercase, number, and special character'),
        
        body('role')
            .optional()
            .isIn(['user', 'admin', 'recruiter']).withMessage('Invalid user role')
    ]),

    // Job validations
    createJob: validate([
        body('title')
            .trim()
            .isLength({ min: 5, max: 100 }).withMessage('Job title must be 5-100 characters'),
        
        body('description')
            .trim()
            .isLength({ min: 50, max: 1000 }).withMessage('Job description must be 50-1000 characters'),
        
        body('requiredSkills')
            .isArray({ min: 1, max: 20 }).withMessage('1-20 skills required'),
        
        body('salary.min')
            .isFloat({ min: 0 }).withMessage('Minimum salary must be a positive number'),
        
        body('salary.max')
            .isFloat().withMessage('Maximum salary must be a number')
            .custom((value, { req }) => {
                if (value < req.body.salary.min) {
                    throw new Error('Maximum salary must be greater than minimum salary');
                }
                return true;
            }),
        
        body('applicationDeadline')
            .isISO8601().toDate()
            .custom(value => {
                if (value <= new Date()) {
                    throw new Error('Application deadline must be in the future');
                }
                return true;
            })
    ]),

    // Test validations
    createTest: validate([
        body('title')
            .trim()
            .isLength({ min: 5, max: 100 }).withMessage('Test title must be 5-100 characters'),
        
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
        
        body('difficulty')
            .isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level'),
        
        body('questions')
            .isArray({ min: 1 }).withMessage('At least one question is required')
    ])
};

module.exports = validationMiddleware;
