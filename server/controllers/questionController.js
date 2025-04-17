const Question = require('../models/Question');
const { validationResult } = require('express-validator');
const { logger } = require('../middleware/logger');

// Get all questions with filtering
exports.getQuestions = async (req, res) => {
  try {
    const { type, difficulty, category, search, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Type filter (exact match)
    if (type === 'Multiple Choice' || type === 'Coding') {
      filter.type = type;
    }
    
    // Other filters with case-insensitive regex
    if (difficulty) {
      filter.difficulty = new RegExp(`^${difficulty}$`, 'i');
    }
    if (category) {
      filter.category = new RegExp(`^${category}$`, 'i');
    }
    
    // Add search functionality for content
    if (search) {
      filter.content = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await Question.countDocuments(filter);

    // Get questions with pagination and sorting
    const questions = await Question.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Transform questions to ensure correct format
    const formattedQuestions = questions.map(q => {
      const question = q.toObject();
      if (question.type === 'Multiple Choice') {
        // Ensure options are properly formatted
        question.options = question.options.map(opt => ({
          text: opt.text,
          isCorrect: opt.isCorrect
        }));
      }
      return question;
    });

    res.json({
      questions: formattedQuestions,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
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

    // Validate question data based on type
    const questionData = {
      ...req.body,
      createdBy: req.user._id
    };

    if (questionData.type === 'Multiple Choice') {
      // Ensure at least one option is marked as correct
      if (!questionData.options?.some(opt => opt.isCorrect)) {
        return res.status(400).json({
          message: 'Multiple choice questions must have at least one correct answer'
        });
      }
    } else if (questionData.type === 'Coding') {
      // Ensure test cases are present
      if (!questionData.testCases?.length) {
        return res.status(400).json({
          message: 'Coding questions must have at least one test case'
        });
      }
    }

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

    // Validate updated data based on type
    const updateData = {
      ...req.body,
      version: question.version + 1,
      updatedAt: new Date()
    };

    if (updateData.type === 'Multiple Choice') {
      if (!updateData.options?.some(opt => opt.isCorrect)) {
        return res.status(400).json({
          message: 'Multiple choice questions must have at least one correct answer'
        });
      }
    } else if (updateData.type === 'Coding') {
      if (!updateData.testCases?.length) {
        return res.status(400).json({
          message: 'Coding questions must have at least one test case'
        });
      }
    }

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
    const question = await Question.findById(id);

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