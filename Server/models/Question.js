const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mcq', 'coding', 'subjective', 'true_false'],
    required: true,
    index: true
  },
  content: {
    question: {
      type: String,
      required: true,
      trim: true,
      minlength: [10, 'Question must be at least 10 characters long'],
      maxlength: [500, 'Question cannot exceed 500 characters']
    },
    options: [{
      text: {
        type: String,
        trim: true
      },
      isCorrect: {
        type: Boolean,
        default: false
      }
    }],
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: function() {
        return this.type !== 'subjective';
      }
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: [1000, 'Explanation cannot exceed 1000 characters']
    },
    testCases: [{
      input: {
        type: String,
        required: function() {
          return this.type === 'coding';
        }
      },
      expectedOutput: {
        type: String,
        required: function() {
          return this.type === 'coding';
        }
      },
      isHidden: {
        type: Boolean,
        default: false
      },
      points: {
        type: Number,
        default: 1,
        min: [0, 'Test case points cannot be negative']
      }
    }]
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  maxScore: {
    type: Number,
    required: true,
    default: 10,
    min: [1, 'Minimum score is 1'],
    max: [50, 'Maximum score is 50']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  timeEstimate: {
    type: Number,
    default: 5,  // minutes
    min: [1, 'Minimum time estimate is 1 minute'],
    max: [30, 'Maximum time estimate is 30 minutes']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  hints: [{
    text: {
      type: String,
      trim: true,
      maxlength: [200, 'Hint cannot exceed 200 characters']
    },
    penaltyPoints: {
      type: Number,
      default: 1,
      min: [0, 'Penalty points cannot be negative']
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient querying
questionSchema.index({ 
  type: 1, 
  difficulty: 1, 
  category: 1 
});
questionSchema.index({ tags: 1 });
questionSchema.index({ createdBy: 1, isPublic: 1 });

// Virtual to calculate total test case points
questionSchema.virtual('totalTestCasePoints').get(function() {
  return this.content.testCases.reduce((sum, tc) => sum + (tc.points || 0), 0);
});

// Method to validate question based on type
questionSchema.methods.validateQuestion = function() {
  const errors = [];

  switch (this.type) {
    case 'mcq':
      if (!this.content.options || this.content.options.length < 2) {
        errors.push('MCQ must have at least 2 options');
      }
      if (!this.content.options.some(opt => opt.isCorrect)) {
        errors.push('MCQ must have at least one correct option');
      }
      break;

    case 'coding':
      if (!this.content.testCases || this.content.testCases.length === 0) {
        errors.push('Coding question must have at least one test case');
      }
      break;

    case 'true_false':
      if (this.content.options.length !== 2) {
        errors.push('True/False question must have exactly 2 options');
      }
      break;
  }

  return errors;
};

// Static method to find questions by tags
questionSchema.statics.findByTags = async function(tags, options = {}) {
  const { 
    limit = 10, 
    difficulty = null, 
    type = null 
  } = options;

  const query = { 
    tags: { $in: tags },
    isPublic: true 
  };

  if (difficulty) query.difficulty = difficulty;
  if (type) query.type = type;

  return this.find(query)
    .limit(limit)
    .sort({ difficulty: 1 });
};

module.exports = mongoose.model('Question', questionSchema);
