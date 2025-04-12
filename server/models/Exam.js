const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting',
    required: true
  },
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    version: {
      type: Number,
      required: true
    }
  }],
  duration: {
    type: Number, // in minutes
    required: true
  },
  passingCriteria: {
    type: Number, // percentage
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Exam configuration
  aptitudeConfig: {
    enabled: {
      type: Boolean,
      default: false
    },
    duration: Number,
    passingScore: Number
  },
  codingConfig: {
    enabled: {
      type: Boolean,
      default: false
    },
    duration: Number,
    passingScore: Number
  }
}, {
  timestamps: true
});

// Indexes
examSchema.index({ jobId: 1 });
examSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Exam', examSchema); 