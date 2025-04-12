const mongoose = require('mongoose');

const ExamAttemptSchema = new mongoose.Schema({
  // Basic Information
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Aptitude Round Attempt
  aptitudeAttempt: {
    startTime: Date,
    endTime: Date,
    answers: [{
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      selectedOption: Number,
      isCorrect: Boolean,
      marksObtained: Number
    }],
    totalScore: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'failed'],
      default: 'not_started'
    }
  },

  // Coding Round Attempt
  codingAttempt: {
    startTime: Date,
    endTime: Date,
    problems: [{
      problemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      language: String,
      code: String,
      testResults: [{
        testCaseId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true
        },
        passed: Boolean,
        output: String,
        error: String,
        executionTime: Number,
        memoryUsed: Number
      }],
      totalScore: {
        type: Number,
        default: 0
      }
    }],
    totalScore: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'failed'],
      default: 'not_started'
    }
  },

  // Overall Exam Status
  overallStatus: {
    type: String,
    enum: ['not_started', 'aptitude_in_progress', 'aptitude_completed', 'coding_in_progress', 'completed', 'failed'],
    default: 'not_started'
  },
  finalScore: {
    type: Number,
    default: 0
  },
  result: {
    type: String,
    enum: ['pass', 'fail', 'pending'],
    default: 'pending'
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
ExamAttemptSchema.index({ examId: 1, userId: 1 });
ExamAttemptSchema.index({ jobId: 1, userId: 1 });
ExamAttemptSchema.index({ userId: 1, overallStatus: 1 });

const ExamAttempt = mongoose.model('ExamAttempt', ExamAttemptSchema);

module.exports = ExamAttempt; 