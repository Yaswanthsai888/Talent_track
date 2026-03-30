const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Test title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: true,
    minlength: [20, 'Description must be at least 20 characters']
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  testType: {
    type: String,
    enum: ['aptitude', 'coding', 'mixed', 'technical', 'personality'],
    required: true,
    index: true
  },
  difficultyLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium',
    index: true
  },
  timeLimit: {
    type: Number,
    required: true,
    min: [5, 'Minimum test duration is 5 minutes'],
    max: [180, 'Maximum test duration is 3 hours']
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  }],
  maxAttempts: {
    type: Number,
    default: 1,
    min: [1, 'Minimum 1 attempt allowed'],
    max: [3, 'Maximum 3 attempts allowed']
  },
  passingCriteria: {
    type: {
      minScore: {
        type: Number,
        default: 60,
        min: [0, 'Minimum score cannot be negative'],
        max: [100, 'Maximum score cannot exceed 100']
      },
      scoringMethod: {
        type: String,
        enum: ['percentage', 'absolute'],
        default: 'percentage'
      }
    }
  },
  skillTags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  startDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !this.endDate || v > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  testConfig: {
    randomizeQuestions: {
      type: Boolean,
      default: true
    },
    showCorrectAnswers: {
      type: Boolean,
      default: false
    },
    negativeMarking: {
      type: Boolean,
      default: false
    },
    negativeMarkingFactor: {
      type: Number,
      default: 0.25,
      min: [0, 'Negative marking factor cannot be negative'],
      max: [1, 'Negative marking factor cannot exceed 1']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for efficient querying
testSchema.index({ 
  jobId: 1, 
  testType: 1, 
  difficultyLevel: 1 
});

// Virtual to check if test is currently active
testSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return this.isActive && 
         (!this.startDate || now >= this.startDate) && 
         (!this.endDate || now <= this.endDate);
});

// Method to validate test configuration
testSchema.methods.validateTestConfig = function() {
  const errors = [];

  if (this.questions.length === 0) {
    errors.push('Test must have at least one question');
  }

  if (this.timeLimit < 5 || this.timeLimit > 180) {
    errors.push('Time limit must be between 5 and 180 minutes');
  }

  return errors;
};

// Static method to find tests by skill tags
testSchema.statics.findBySkillTags = async function(skillTags) {
  return this.find({
    skillTags: { $in: skillTags },
    isActive: true
  }).populate('questions');
};

module.exports = mongoose.model('Test', testSchema);
