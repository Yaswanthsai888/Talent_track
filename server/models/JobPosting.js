const mongoose = require('mongoose');

const JobPostingSchema = new mongoose.Schema({
  // Job Title & Overview
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  employmentType: {
    type: String,
    enum: ['Full-Time', 'Part-Time', 'Contract', 'Remote'],
    default: 'Full-Time'
  },
  
  // Job Description
  overview: {
    type: String,
    required: true
  },
  responsibilities: [{
    type: String,
    trim: true
  }],
  
  // Qualifications & Requirements
  requiredSkills: [{
    type: String,
    trim: true
  }],
  educationLevel: {
    type: String,
    enum: ['High School', 'Associate\'s', 'Bachelor\'s', 'Master\'s', 'PhD'],
    default: 'Bachelor\'s'
  },
  minExperience: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Compensation
  salaryRange: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'INR'],
      default: 'USD'
    }
  },
  benefits: [{
    type: String,
    trim: true
  }],
  
  // Application Process
  applicationDeadline: {
    type: Date,
    required: true
  },
  applicationInstructions: {
    type: String,
    required: true
  },
  
  // Additional Fields
  department: {
    type: String,
    trim: true
  },
  industryType: {
    type: String,
    trim: true
  },
  
  // New Fields
  notes: {
    type: String,
    select: false // Only fetched when explicitly requested
  },
  
  nextRound: {
    type: {
      type: String,
      enum: ['interview', 'technical', 'hr'],
      default: 'interview'
    },
    date: Date,
    instructions: String
  },
  
  selectedCandidates: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['selected', 'on-hold', 'rejected'],
      default: 'selected'
    },
    notes: String
  }],
  
  // Exam Reference
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    default: null
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true  
  }
}, {
  timestamps: true  
});

// Compound index for faster job retrieval
JobPostingSchema.index({ createdBy: 1, isActive: 1 });

const JobPosting = mongoose.model('JobPosting', JobPostingSchema);

module.exports = JobPosting;
