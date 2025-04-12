const Question = require('../models/Question');
const { validationResult } = require('express-validator');
const { logger } = require('../middleware/logger');

// Get all questions with filtering
exports.getQuestions = async (req, res) => {
  try {
    const { type, difficulty, category, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = {};
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await Question.countDocuments(filter);

    // Get questions with pagination
    const questions = await Question.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    res.json({
      questions,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalQuestions: total
    });
  } catch (error) {
    logger.error('Error fetching questions:', error);
    res.status(500).json({
      message: 'Error fetching questions',
      error: error.message
    });
  }
};

// Create a new question
exports.createQuestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const questionData = {
      ...req.body,
      createdBy: req.user._id,
      isCustom: true
    };

    const question = new Question(questionData);
    await question.save();

    res.status(201).json(question);
  } catch (error) {
    logger.error('Error creating question:', error);
    res.status(500).json({
      message: 'Error creating question',
      error: error.message
    });
  }
};

// Update a question
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user is the creator
    if (question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this question' });
    }

    // Increment version
    const updateData = {
      ...req.body,
      version: question.version + 1,
      lastUpdated: new Date()
    };

    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    res.json(updatedQuestion);
  } catch (error) {
    logger.error('Error updating question:', error);
    res.status(500).json({
      message: 'Error updating question',
      error: error.message
    });
  }
};

// Delete a question
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user is the creator
    if (question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this question' });
    }

    await Question.findByIdAndDelete(id);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    logger.error('Error deleting question:', error);
    res.status(500).json({
      message: 'Error deleting question',
      error: error.message
    });
  }
};

// Get question by ID
exports.getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id).populate('createdBy', 'name email');

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json(question);
  } catch (error) {
    logger.error('Error fetching question:', error);
    res.status(500).json({
      message: 'Error fetching question',
      error: error.message
    });
  }
};

// Get all questions
exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (error) {
    logger.error('Error fetching questions:', error);
    res.status(500).json({
      message: 'Error fetching questions',
      error: error.message
    });
  }
}; 