const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const JobPosting = require('../models/JobPosting');
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');

// Get admin profile
router.get('/me', protect, async (req, res) => {
  try {
    // Use lean() for better performance and populate activeJobPostings
    const admin = await Admin.findById(req.user.id)
      .select('-password')
      .populate('activeJobPostings')
      .lean();
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Count active job postings with an efficient query
    const activeJobPostingsCount = await JobPosting.countDocuments({ 
      createdBy: req.user.id,
      isActive: true 
    });

    // Get detailed job postings for debugging
    const jobPostings = await JobPosting.find({ 
      createdBy: req.user.id,
      isActive: true 
    }).select('_id title isActive createdBy').lean();

    console.log('Job Postings Debug:', {
      adminId: req.user.id,
      totalJobPostings: activeJobPostingsCount,
      jobPostingDetails: jobPostings
    });

    res.json({
      ...admin,
      activeJobPostingsCount
    });
  } catch (error) {
    console.error('Admin profile fetch error:', {
      adminId: req.user?.id,
      errorMessage: error.message,
      errorStack: error.stack
    });
    res.status(500).json({ message: 'Server error fetching admin profile' });
  }
});

// Update admin profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, companyName } = req.body;

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.user.id, 
      { 
        name, 
        companyName 
      }, 
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      admin: updatedAdmin
    });
  } catch (error) {
    console.error('Admin profile update error:', error);
    res.status(500).json({ message: 'Server error updating admin profile' });
  }
});

// Update job posting
router.put('/job/:jobId', protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { jobId } = req.params;
    const updateData = req.body;

    // Ensure the job belongs to the current admin
    const existingJob = await JobPosting.findOne({ 
      _id: jobId, 
      createdBy: req.user.id 
    });

    if (!existingJob) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Job posting not found or unauthorized' });
    }

    // Update job posting
    const updatedJob = await JobPosting.findByIdAndUpdate(
      jobId, 
      updateData, 
      { 
        new: true, 
        runValidators: true,
        session 
      }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.json({
      message: 'Job posting updated successfully',
      job: updatedJob
    });
  } catch (error) {
    // Rollback transaction
    await session.abortTransaction();
    session.endSession();

    console.error('Job posting update error:', error);
    res.status(500).json({ 
      message: 'Server error updating job posting', 
      error: error.message 
    });
  }
});

module.exports = router;
