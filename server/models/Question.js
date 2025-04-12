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
  options: [{
    text: String,
    isCorrect: Boolean
  }],
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Update the updatedAt field before saving
questionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validate options for aptitude questions
questionSchema.pre('save', function(next) {
  if (this.type === 'Multiple Choice' && (!this.options || this.options.length < 2)) {
    next(new Error('Multiple Choice questions must have at least 2 options'));
  }
  next();
});

// Indexes for efficient querying
questionSchema.index({ type: 1, difficulty: 1, category: 1 });
questionSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Question', questionSchema); 