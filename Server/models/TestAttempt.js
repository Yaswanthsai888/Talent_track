const mongoose = require('mongoose');

const testAttemptSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    answer: String,
    submittedAt: Date,
    isCorrect: Boolean
  }],
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'evaluated'],
    default: 'in_progress'
  },
  timeTaken: Number,
  score: {
    total: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    individual: [{
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      },
      score: Number,
      maxScore: Number,
      feedback: String
    }]
  },
  evaluationStatus: {
    type: String,
    enum: ['pending', 'evaluating', 'completed', 'failed'],
    default: 'pending'
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  selectedForNextRound: {
    type: Boolean,
    default: false
  },
  evaluatedAt: Date,
  retries: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Add indexes for efficient querying
testAttemptSchema.index({ testId: 1, userId: 1 });
testAttemptSchema.index({ testId: 1, score: -1, endTime: 1 });
testAttemptSchema.index({ evaluationStatus: 1 });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
