const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  totalDuration: {
    type: Number,
    required: true,
    min: 1
  },
  passingCriteria: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    version: {
      type: Number,
      default: 1
    }
  }],
  aptitudeConfig: {
    enabled: {
      type: Boolean,
      default: false
    },
    duration: Number,
    passingScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  codingConfig: {
    enabled: {
      type: Boolean,
      default: false
    },
    duration: Number,
    passingScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// Index for faster lookups
examSchema.index({ jobId: 1, status: 1 });
examSchema.index({ createdBy: 1, status: 1 });

const Exam = mongoose.model('Exam', examSchema);
module.exports = Exam;