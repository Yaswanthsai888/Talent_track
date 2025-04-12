const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { 
    type: String, 
    required: true,
    select: false
  },
  role: { type: String, default: 'admin', immutable: true },
  companyName: { type: String, required: true },
  adminKey: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  verifiedCompany: { type: Boolean, default: false },
  activeJobPostings: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'JobPosting' // Changed from 'Job' to 'JobPosting'
  }],
}, { timestamps: true });

// Add index for activeJobPostings
adminSchema.index({ activeJobPostings: 1 });

// Pre-save middleware for password hashing
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

adminSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
