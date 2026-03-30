const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Check if model already exists before defining
const modelName = 'User';

// If model doesn't exist, create it
if (!mongoose.models[modelName]) {
  const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: [12, 'Password must be at least 12 characters long']
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'recruiter'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: Date,
    skills: [{
      type: String,
      trim: true
    }],
    resume: {
      filename: String,
      path: String,
      uploadedAt: Date
    },
    loginAttempts: {
      type: Number,
      required: true,
      default: 0
    },
    lockUntil: {
      type: Date,
      default: null
    },
    isLocked: {
      type: Boolean,
      default: false
    }
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

  // Virtual for checking if account is locked
  userSchema.virtual('isAccountLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
  });

  // Indexes
  userSchema.index({ role: 1 });

  // Pre-save hook to hash password
  userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      return next(error);
    }
  });

  // Method to compare password
  userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };

  // Method to increment login attempts
  userSchema.methods.incrementLoginAttempts = function() {
    const maxAttempts = 5;
    const lockoutDuration = 15;

    this.loginAttempts += 1;

    if (this.loginAttempts >= maxAttempts) {
      this.isLocked = true;
      this.lockUntil = new Date(Date.now() + (lockoutDuration * 60 * 1000)); // lockout for specified minutes
    }

    return this.save();
  };

  // Method to reset login attempts
  userSchema.methods.resetLoginAttempts = function() {
    this.loginAttempts = 0;
    this.isLocked = false;
    this.lockUntil = null;
    return this.save();
  };

  mongoose.model(modelName, userSchema);
}

module.exports = mongoose.models[modelName] || mongoose.model(modelName);
