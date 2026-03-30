const mongoose = require('mongoose');

const testAttemptSchema = new mongoose.Schema({
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
    answer: String, // Selected option for MCQ or code for coding
    submittedAt: Date
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
  timeTaken: Number, // in minutes
  score: {
    total: {
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
      feedback: String // For storing specific feedback about the answer
    }]
  },
  evaluationStatus: {
    type: String,
    enum: ['pending', 'evaluating', 'completed', 'failed'],
    default: 'pending'
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
});

// Add index for efficient querying
testAttemptSchema.index({ testId: 1, score: -1, endTime: 1 });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
