const mongoose = require('mongoose');

const userTestAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
    index: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    index: true
  },
  status: {
    type: String,
    enum: ['started', 'completed', 'submitted', 'evaluated'],
    default: 'started',
    index: true
  },
  questions: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedOptions: [String],
    submittedCode: String,
    submittedText: String,
    isCorrect: Boolean,
    obtainedScore: {
      type: Number,
      default: 0,
      min: [0, 'Score cannot be negative']
    }
  }],
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  timeSpent: {
    type: Number,
    default: 0,
    min: [0, 'Time spent cannot be negative']
  },
  totalScore: {
    type: Number,
    default: 0,
    min: [0, 'Total score cannot be negative']
  },
  maxPossibleScore: {
    type: Number,
    required: true
  },
  scorePercentage: {
    type: Number,
    default: 0,
    min: [0, 'Score percentage cannot be negative'],
    max: [100, 'Score percentage cannot exceed 100']
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  detailedResults: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    type: {
      type: String,
      enum: ['mcq', 'coding', 'subjective', 'true_false']
    },
    maxScore: Number,
    obtainedScore: Number
  }],
  hintsUsed: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    hintIndex: Number,
    penaltyPoints: Number
  }],
  performanceInsights: {
    type: mongoose.Schema.Types.Mixed
  },
  attempts: {
    type: Number,
    default: 1,
    min: [1, 'Minimum 1 attempt']
  },
  isEarlyFinish: {
    type: Boolean,
    default: false
  },
  bonusPoints: {
    type: Number,
    default: 0,
    min: [0, 'Bonus points cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient querying
userTestAttemptSchema.index({ 
  user: 1, 
  test: 1, 
  status: 1 
});
userTestAttemptSchema.index({ 
  job: 1, 
  status: 1, 
  scorePercentage: -1 
});

// Virtual to calculate remaining time
userTestAttemptSchema.virtual('remainingTime').get(function() {
  if (!this.test || !this.startTime) return 0;
  
  const testDuration = this.test.timeLimit * 60 * 1000; // Convert minutes to milliseconds
  const elapsedTime = Date.now() - this.startTime.getTime();
  
  return Math.max(0, testDuration - elapsedTime);
});

// Method to mark test as completed
userTestAttemptSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.endTime = new Date();
  this.timeSpent = this.endTime.getTime() - this.startTime.getTime();
  
  // Check for early finish bonus
  if (this.timeSpent < (this.test.timeLimit * 60 * 1000 * 0.5)) {
    this.isEarlyFinish = true;
    this.bonusPoints = Math.floor(this.test.timeLimit * 0.1);
  }
};

// Static method to find recent test attempts
userTestAttemptSchema.statics.findRecentAttempts = async function(userId, options = {}) {
  const { 
    limit = 10, 
    status = null, 
    sortBy = 'createdAt' 
  } = options;

  const query = { user: userId };
  if (status) query.status = status;

  return this.find(query)
    .populate('test')
    .sort({ [sortBy]: -1 })
    .limit(limit);
};

module.exports = mongoose.model('UserTestAttempt', userTestAttemptSchema);
