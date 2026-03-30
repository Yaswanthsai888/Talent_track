const mongoose = require('mongoose');

const testAnalyticsSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  totalAttempts: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  medianScore: Number,
  highestScore: Number,
  lowestScore: Number,
  timeStats: {
    averageTime: Number, // in minutes
    fastestTime: Number,
    slowestTime: Number
  },
  questionStats: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    correctAnswers: Number,
    totalAttempts: Number,
    averageScore: Number,
    averageTime: Number // time spent on this question
  }],
  scoreDistribution: [{
    range: String, // e.g., "0-10", "11-20", etc.
    count: Number
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Add index for efficient querying
testAnalyticsSchema.index({ testId: 1, lastUpdated: -1 });

module.exports = mongoose.model('TestAnalytics', testAnalytics);
