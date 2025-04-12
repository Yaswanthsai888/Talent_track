const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { 
    type: String, 
    required: true,
    select: false // Don't include password by default in queries
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number']
  },
  // User specific fields
  experience: { type: String, enum: ['fresher', 'experienced'] },
  yearsOfExperience: { type: Number },
  previousCompanies: { type: String },
  skills: [{
    type: String,
    trim: true,
    get: v => v,
    set: v => typeof v === 'string' ? v.trim() : v
  }],
  appliedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting'
  }],
  // Admin specific fields
  adminKey: { type: String },
  companyName: { type: String }
}, { timestamps: true });

// Single pre-save middleware for password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    console.log('Password hashing for:', this.email);
    console.log('Original password length:', this.password?.length);
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    
    console.log('Hashed password length:', hashedPassword.length);
    this.password = hashedPassword;
    
    next();
  } catch (error) {
    console.error('Password hashing error:', error);
    next(error);
  }
});

userSchema.pre('save', async function(next) {
  if (this.isModified('skills')) {
    this.skills = this.skills.map(skill => skill.trim()).filter(Boolean);
  }
  next();
});

// Add new comparePassword method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Password comparison:', {
      userEmail: this.email,
      hasStoredPassword: !!this.password,
      candidateLength: candidatePassword?.length,
      storedLength: this.password?.length
    });

    if (!this.password) {
      console.error('No password hash found for user:', this.email);
      return false;
    }

    if (!candidatePassword) {
      console.error('No candidate password provided');
      return false;
    }

    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password match result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Add method to calculate skill match
userSchema.methods.calculateSkillMatch = function(jobSkills) {
  const userSkills = this.skills.map(skill => skill.toLowerCase());
  const normalizedJobSkills = jobSkills.map(skill => skill.toLowerCase());
  
  const matchedSkills = userSkills.filter(skill => 
    normalizedJobSkills.includes(skill)
  );

  return (matchedSkills.length / normalizedJobSkills.length) * 100;
};

userSchema.methods.hasAppliedToJob = async function(jobId) {
  return this.appliedJobs.includes(jobId);
};

// Add this method to get application status
userSchema.methods.getApplicationsCount = async function() {
  return this.appliedJobs.length;
};

// Add a method to format skills
userSchema.methods.formatSkills = function() {
  if (!this.skills) return [];
  return this.skills.map(skill => skill.trim()).filter(Boolean);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
