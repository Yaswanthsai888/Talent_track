const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth');
const { validateQuestionInput } = require('../middleware/inputValidator');
const questionController = require('../controllers/questionController');

// Get all questions
router.get('/', protect, questionController.getQuestions);

// Get question by ID
router.get('/:id', protect, questionController.getQuestionById);

// Create new question (admin only)
router.post('/', protect, requireAdmin, validateQuestionInput, questionController.createQuestion);

// Update question (admin only)
router.put('/:id', protect, requireAdmin, validateQuestionInput, questionController.updateQuestion);

// Delete question (admin only)
router.delete('/:id', protect, requireAdmin, questionController.deleteQuestion);

module.exports = router;