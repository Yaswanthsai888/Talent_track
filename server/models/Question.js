const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Multiple Choice', 'Coding'],
    required: [true, 'Question type is required']
  },
  content: {
    type: String,
    required: [true, 'Question content is required']
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: [true, 'Question difficulty is required']
  },
  category: {
    type: String,
    required: [true, 'Question category is required']
  },
  points: {
    type: Number,
    required: [true, 'Question points are required'],
    min: [1, 'Points must be at least 1']
  },
  // For Multiple Choice Questions
  options: [{    text: {
      type: String,
      required: function() {
        return this.parent().parent().type === 'Multiple Choice';
      }
    },
    isCorrect: {
      type: Boolean,
      required: function() {
        return this.parent().parent().type === 'Multiple Choice';
      }
    }
  }],
  // For Coding Questions
  testCases: [{
    input: String,
    expectedOutput: String,
    isPublic: {
      type: Boolean,
      default: true
    }
  }],
  allowedLanguages: {
    type: [String],
    default: ['javascript', 'python', 'java'],
    required: function() {
      return this.type === 'Coding';
    }
  },
  // Common fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp on save
questionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add validation for question type specific fields
questionSchema.pre('validate', function(next) {
  if (this.type === 'Multiple Choice') {
    if (!Array.isArray(this.options) || this.options.length < 2) {
      next(new Error('Multiple choice questions must have at least 2 options'));
    }
    if (!this.options.some(opt => opt.isCorrect)) {
      next(new Error('Multiple choice questions must have at least one correct answer'));
    }
  } else if (this.type === 'Coding') {
    if (!Array.isArray(this.testCases) || this.testCases.length === 0) {
      next(new Error('Coding questions must have at least one test case'));
    }
    if (!Array.isArray(this.allowedLanguages) || this.allowedLanguages.length === 0) {
      next(new Error('Coding questions must have at least one allowed language'));
    }
  }
  next();
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;