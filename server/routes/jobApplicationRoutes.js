const express = require('express');
const router = express.Router();
const JobApplication = require('../models/JobApplication');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const axios = require('axios');

// Apply for a job
router.post('/:jobId/apply', protect, async (req, res) => {
  try {
    const { coverLetter, resumeParseResult } = req.body;
    const jobId = req.params.jobId;

    // Check for existing application
    const existingApplication = await JobApplication.findOne({
      jobId,
      userId: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied to this job' });
    }

    // Update user's skills from resume parser results
    if (resumeParseResult && resumeParseResult.success && resumeParseResult.skills) {
      await User.findByIdAndUpdate(
        req.user.id,
        { 
          $addToSet: { skills: { $each: resumeParseResult.skills } }
        },
        { new: true }
      );
    }

    // Create application
    const application = await JobApplication.create({
      jobId,
      userId: req.user.id,
      coverLetter
    });

    // Update user's appliedJobs
    await User.findByIdAndUpdate(req.user.id, {
      $push: { appliedJobs: jobId }
    });

    res.status(201).json({ 
      message: 'Application submitted successfully',
      application,
      updatedSkills: resumeParseResult?.skills || []
    });
  } catch (error) {
    console.error('Application error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get applications for a job (admin only)
router.get('/job/:jobId', protect, async (req, res) => {
  try {
    const applications = await JobApplication.find({ jobId: req.params.jobId })
      .populate('userId', 'name email skills experience')
      .sort('-createdAt')
      .lean(); // Add lean() for better performance

    // Add data validation
    const validatedApplications = applications.map(app => ({
      ...app,
      userId: app.userId || {
        name: 'Unknown User',
        email: 'No email provided',
        skills: [],
        experience: 'Not specified'
      }
    }));

    res.json(validatedApplications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Error fetching applications' });
  }
});

// Add route to get total applications count
router.get('/total-count', protect, async (req, res) => {
  try {
    const count = await JobApplication.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update application status (admin only)
router.put('/:jobId/applications/:applicationId/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    // Validate status value
    const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Find and update the application
    const application = await JobApplication.findById(req.params.applicationId);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Convert ObjectId to string for comparison
    const jobIdStr = application.jobId.toString();
    const paramJobIdStr = req.params.jobId.toString();

    if (jobIdStr !== paramJobIdStr) {
      return res.status(400).json({ 
        message: 'Application does not belong to this job',
        applicationJobId: jobIdStr,
        requestedJobId: paramJobIdStr
      });
    }

    application.status = status;
    const updatedApplication = await application.save();

    // Populate the user data before sending response
    await updatedApplication.populate('userId', 'name email skills experience');

    res.json({ 
      message: 'Application status updated successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ 
      message: 'Error updating application status',
      error: error.message 
    });
  }
});

module.exports = router;
