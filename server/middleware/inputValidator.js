const { body, validationResult } = require('express-validator');
const xss = require('xss');

// Sanitize and validate exam creation input
const validateExamInput = [
  body('name').trim().notEmpty().withMessage('Exam name is required')
    .isLength({ max: 100 }).withMessage('Exam name must be less than 100 characters')
    .customSanitizer(value => xss(value)),
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters')
    .customSanitizer(value => xss(value)),
  body('duration').isInt({ min: 1, max: 180 }).withMessage('Duration must be between 1 and 180 minutes'),
  body('passingCriteria').isInt({ min: 0, max: 100 }).withMessage('Passing criteria must be between 0 and 100'),
  body('aptitudeConfig.enabled').isBoolean().withMessage('Aptitude config enabled must be a boolean'),
  body('aptitudeConfig.duration').isInt({ min: 1, max: 180 }).withMessage('Aptitude duration must be between 1 and 180 minutes'),
  body('aptitudeConfig.passingScore').isInt({ min: 0, max: 100 }).withMessage('Aptitude passing score must be between 0 and 100'),
  body('codingConfig.enabled').isBoolean().withMessage('Coding config enabled must be a boolean'),
  body('codingConfig.duration').isInt({ min: 1, max: 180 }).withMessage('Coding duration must be between 1 and 180 minutes'),
  body('codingConfig.passingScore').isInt({ min: 0, max: 100 }).withMessage('Coding passing score must be between 0 and 100'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Sanitize and validate question input
const validateQuestionInput = [
  body('title').trim().notEmpty().withMessage('Question title is required')
    .isLength({ max: 200 }).withMessage('Title must be less than 200 characters')
    .customSanitizer(value => xss(value)),
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters')
    .customSanitizer(value => xss(value)),
  body('type').isIn(['aptitude', 'coding']).withMessage('Question type must be either aptitude or coding'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Difficulty must be easy, medium, or hard'),
  body('topic').trim().notEmpty().withMessage('Topic is required')
    .isLength({ max: 50 }).withMessage('Topic must be less than 50 characters')
    .customSanitizer(value => xss(value)),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Sanitize and validate code submission
const validateCodeSubmission = [
  body('code').trim().notEmpty().withMessage('Code is required')
    .isLength({ max: 10000 }).withMessage('Code must be less than 10000 characters')
    .customSanitizer(value => xss(value)),
  body('language').isIn(['javascript', 'python', 'java']).withMessage('Invalid programming language'),
  body('problemId').isMongoId().withMessage('Invalid problem ID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateExamInput,
  validateQuestionInput,
  validateCodeSubmission
}; 