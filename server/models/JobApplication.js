const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
    default: 'pending'
  },
  coverLetter: {
    type: String,
    required: true
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  skillMatch: {
    percentage: {
      type: Number,
      default: 0
    },
    matchedSkills: [{
      type: String
    }],
    calculatedAt: {
      type: Date,
      default: Date.now
    }
  }
}, { timestamps: true });

// Compound index for faster queries
jobApplicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });

// Add method to calculate skill match
jobApplicationSchema.methods.calculateSkillMatch = function(jobSkills) {
  if (!this.userId.skills || !jobSkills) return 0;
  
  const userSkills = this.userId.skills.map(s => s.toLowerCase());
  const requiredSkills = jobSkills.map(s => s.toLowerCase());
  
  const matchedSkills = requiredSkills.filter(skill => userSkills.includes(skill));
  const percentage = (matchedSkills.length / requiredSkills.length) * 100;
  
  this.skillMatch = {
    percentage,
    matchedSkills,
    calculatedAt: new Date()
  };
  
  return percentage;
};

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
module.exports = JobApplication;
