const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  testType: {
    type: String,
    enum: ['aptitude', 'coding'],
    required: true
  },
  difficultyLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  numberOfQuestions: {
    type: Number,
    required: true
  },
  timeLimit: {
    type: Number, // in minutes
    required: true
  },
  schedule: {
    startDate: Date,
    endDate: Date
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  advancedConfig: {
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    allowPartialAnswers: {
      type: Boolean,
      default: true
    },
    negativeMarking: {
      enabled: {
        type: Boolean,
        default: false
      },
      value: {
        type: Number,
        default: 0
      }
    },
    passingScore: {
      type: Number,
      default: 60
    },
    maxAttempts: {
      type: Number,
      default: 1
    }
  }
});

module.exports = mongoose.model('Test', testSchema);
