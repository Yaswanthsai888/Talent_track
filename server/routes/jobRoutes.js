const express = require('express');
const router = express.Router();
const JobPosting = require('../models/JobPosting');
const JobApplication = require('../models/JobApplication');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const Admin = require('../models/Admin');
const mongoose = require('mongoose');

// First: Special routes with dynamic parameters
router.get('/:id/application-status', protect, async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;
    
    console.log('Application status check:', { jobId, userId });

    const existingApplication = await JobApplication.findOne({
      jobId,
      userId
    }).populate('userId', 'name email phoneNumber skills experience');

    // Format user data properly
    const userData = existingApplication?.userId ? {
      _id: existingApplication.userId._id,
      name: existingApplication.userId.name || 'Not specified',
      email: existingApplication.userId.email || 'Not specified',
      phoneNumber: existingApplication.userId.phoneNumber || 'Not specified',
      skills: existingApplication.userId.skills || [],
      experience: existingApplication.userId.experience || 'Not specified'
    } : null;

    res.json({
      hasApplied: Boolean(existingApplication),
      applicationStatus: existingApplication?.status || 'pending',
      user: userData
    }); 
  } catch (error) {
    console.error('Application status check error:', error);
    res.status(500).json({ message: 'Error checking application status' });
  }
});

router.get('/:id/applications/count', protect, async (req, res) => {
  try {
    const count = await JobApplication.countDocuments({ 
      jobId: req.params.id
    });
    
    console.log(`Application count for job ${req.params.id}:`, count);
    res.json({ count });
  } catch (error) {
    console.error('Error getting application count:', error);
    res.status(500).json({ 
      message: 'Error fetching application count',
      error: error.message 
    });
  }
});

router.get('/:id/applications', protect, async (req, res) => {
  try {
    const applications = await JobApplication.find({ jobId: req.params.id })
      .populate('userId', 'name email skills experience phoneNumber')
      .sort('-createdAt')
      .lean();

    const formattedApplications = applications.map(app => ({
      ...app,
      user: app.userId
    }));

    const stats = {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      reviewed: applications.filter(app => app.status === 'reviewed').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      rejected: applications.filter(app => app.status === 'rejected').length
    };

    res.json({ applications: formattedApplications, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk update application statuses based on skill match
router.put('/:id/bulk-update-status', protect, async (req, res) => {
  try {
    const { minSkillMatch, status } = req.body;
    const jobId = req.params.id;

    // Get the job posting to check required skills
    const job = await JobPosting.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Get all applications for this job
    const applications = await JobApplication.find({ jobId })
      .populate('userId', 'skills');

    // Calculate skill matches and filter applications
    const applicationsToUpdate = applications.filter(app => {
      if (!app.userId || !app.userId.skills) return false;
      
      const userSkills = app.userId.skills.map(s => s.toLowerCase());
      const jobSkills = job.requiredSkills.map(s => s.toLowerCase());
      
      const matchedSkills = jobSkills.filter(skill => 
        userSkills.includes(skill)
      );
      
      const matchPercentage = (matchedSkills.length / jobSkills.length) * 100;
      return matchPercentage >= minSkillMatch;
    });

    // Update filtered applications
    const updatePromises = applicationsToUpdate.map(app =>
      JobApplication.findByIdAndUpdate(
        app._id,
        { status },
        { new: true, populate: 'userId' }
      )
    );

    await Promise.all(updatePromises);

    // Get updated applications with stats
    const updatedApplications = await JobApplication.find({ jobId })
      .populate('userId', 'name email phoneNumber skills experience')
      .sort('-createdAt')
      .lean();

    // Ensure complete user data formatting
    const formattedApplications = updatedApplications.map(app => ({
      ...app,
      user: app.userId
    }));

    const stats = {
      total: updatedApplications.length,
      pending: updatedApplications.filter(app => app.status === 'pending').length,
      reviewed: updatedApplications.filter(app => app.status === 'reviewed').length,
      accepted: updatedApplications.filter(app => app.status === 'accepted').length,
      rejected: updatedApplications.filter(app => app.status === 'rejected').length
    };

    res.json({
      message: `Updated ${applicationsToUpdate.length} applications`,
      applications: formattedApplications,
      stats
    });

  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ 
      message: 'Error performing bulk update',
      error: error.message 
    });
  }
});

router.get('/:id/applications/filter', protect, async (req, res) => {
  try {
    const { minSkillMatch } = req.query;
    const jobId = req.params.id;

    const job = await JobPosting.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const applications = await JobApplication.find({ jobId })
      .populate('userId', 'name email skills experience phoneNumber')
      .sort('-createdAt');

    const filteredApplications = applications.filter(app => {
      if (!app.userId || !app.userId.skills) return false;
      
      const userSkills = app.userId.skills.map(s => s.toLowerCase());
      const jobSkills = job.requiredSkills.map(s => s.toLowerCase());
      
      const matchedSkills = jobSkills.filter(skill => 
        userSkills.includes(skill)
      );
      
      const matchPercentage = (matchedSkills.length / jobSkills.length) * 100;
      return matchPercentage >= minSkillMatch;
    });

    const stats = {
      total: filteredApplications.length,
      pending: filteredApplications.filter(app => app.status === 'pending').length,
      reviewed: filteredApplications.filter(app => app.status === 'reviewed').length,
      accepted: filteredApplications.filter(app => app.status === 'accepted').length,
      rejected: filteredApplications.filter(app => app.status === 'rejected').length
    };

    res.json({ applications: filteredApplications, stats });

  } catch (error) {
    console.error('Application filtering error:', error);
    res.status(500).json({ 
      message: 'Error filtering applications',
      error: error.message 
    });
  }
});

// Then: Static routes
router.get('/admin', protect, async (req, res) => {
  try {
    const jobPostings = await JobPosting.find({ 
      createdBy: req.user.id,
      isActive: true
    }).sort({ createdAt: -1 });

    console.log('Admin Job Postings:', {
      adminId: req.user.id,
      jobPostingsCount: jobPostings.length,
      jobPostingDetails: jobPostings.map(job => ({
        id: job._id,
        title: job.title,
        isActive: job.isActive
      }))
    });

    res.status(200).json({
      message: 'Admin job postings retrieved successfully',
      jobPostings
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error retrieving admin job postings',
      error: error.message 
    });
  }
});

router.get('/', async (req, res) => {
  try {
    console.log('Fetching all active jobs');
    const jobPostings = await JobPosting.find({ 
      isActive: true 
    }).sort({ createdAt: -1 });

    console.log(`Found ${jobPostings.length} active jobs`);
    
    res.status(200).json({
      success: true,
      jobPostings
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error retrieving job postings',
      error: error.message 
    });
  }
});

// Get job details
router.get('/:id', async (req, res) => {
  try {
    const job = await JobPosting.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Then: Other dynamic routes
router.post('/:id/apply', protect, async (req, res) => {
  try {
    const { coverLetter } = req.body;
    const jobId = req.params.id;

    // Check if job exists and is active
    const job = await JobPosting.findOne({ _id: jobId, isActive: true });
    if (!job) {
      return res.status(404).json({ message: 'Job not found or inactive' });
    }

    // Check if already applied
    const existingApplication = await JobApplication.findOne({
      jobId,
      userId: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    // Create application
    const application = await JobApplication.create({
      jobId,
      userId: req.user.id,
      coverLetter
    });

    // Update user's applied jobs
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { appliedJobs: jobId }
    });

    // Calculate skill match
    const skillMatchPercentage = application.calculateSkillMatch(job.requiredSkills);

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application,
      skillMatch: skillMatchPercentage
    });
  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit application' 
    });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const jobPosting = await JobPosting.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      {
        ...req.body,
        modifiedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).populate('selectedCandidates.userId', 'name email');

    if (!jobPosting) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    res.status(200).json({
      message: 'Job posting updated successfully',
      jobPosting
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating job posting',
      error: error.message 
    });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const jobPosting = await JobPosting.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { isActive: false },
      { new: true }
    );

    if (!jobPosting) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    res.status(200).json({
      message: 'Job posting deactivated successfully',
      jobPosting
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deactivating job posting',
      error: error.message 
    });
  }
});

// Create a new job posting
router.post('/create', protect, async (req, res) => {
  try {
    console.log('Job Creation Request:', {
      userId: req.user.id,
      requestBody: req.body
    });

    // Verify admin
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      console.error('Job Creation Error: Unauthorized Admin', {
        userId: req.user.id
      });
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    // Validate required fields with detailed checks
    const requiredFields = [
      'title', 'company', 'location', 'overview', 
      'applicationDeadline', 'applicationInstructions', 
      'salaryRange'
    ];
    
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || 
             (typeof value === 'string' && value.trim() === '') ||
             (Array.isArray(value) && value.length === 0) ||
             (typeof value === 'object' && Object.keys(value).length === 0);
    });

    if (missingFields.length > 0) {
      console.error('Job Creation Validation Error', {
        missingFields,
        providedFields: Object.keys(req.body)
      });
      return res.status(400).json({ 
        message: 'Missing or invalid required fields', 
        missingFields 
      });
    }

    // Validate salary range
    if (!req.body.salaryRange || 
        isNaN(Number(req.body.salaryRange.min)) || 
        isNaN(Number(req.body.salaryRange.max)) ||
        Number(req.body.salaryRange.min) > Number(req.body.salaryRange.max)) {
      console.error('Invalid Salary Range', {
        salaryRange: req.body.salaryRange
      });
      return res.status(400).json({ 
        message: 'Invalid salary range',
        details: 'Salary range must be a valid object with numeric min and max values' 
      });
    }

    // Convert salary range values to numbers
    req.body.salaryRange.min = Number(req.body.salaryRange.min);
    req.body.salaryRange.max = Number(req.body.salaryRange.max);

    // Clean up and validate the data
    const jobData = {
      ...req.body,
      createdBy: req.user.id,
      isActive: true
    };

    console.log('Preparing Job Posting:', {
      adminId: req.user.id,
      jobData: {
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        isActive: jobData.isActive
      }
    });

    const newJobPosting = new JobPosting(jobData);
    await newJobPosting.save();

    console.log('Job Posting Created Successfully:', {
      jobId: newJobPosting._id,
      adminId: req.user.id,
      title: newJobPosting.title,
      isActive: newJobPosting.isActive
    });

    res.status(201).json({
      message: 'Job posting created successfully',
      jobPosting: newJobPosting
    });
  } catch (error) {
    console.error('Job Posting Creation Error:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      userId: req.user.id
    });
    
    // Detailed error handling
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid job posting data',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ 
      message: 'Server error while creating job posting',
      error: error.message 
    });
  }
});

router.put('/:jobId/applications/:applicationId/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const { jobId, applicationId } = req.params;

    // Verify admin
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    // Update application status
    const application = await JobApplication.findOneAndUpdate(
      { _id: applicationId, jobId },
      { status },
      { new: true }
    ).populate('userId', 'name email skills experience phoneNumber');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Get updated applications and stats
    const applications = await JobApplication.find({ jobId })
      .populate('userId', 'name email skills experience phoneNumber')
      .sort('-createdAt');

    // Format applications with proper structure
    const formattedApplications = applications.map(app => {
      const formattedApp = app.toObject();
      return {
        ...formattedApp,
        user: formattedApp.userId ? {
          _id: formattedApp.userId._id,
          name: formattedApp.userId.name || 'Not specified',
          email: formattedApp.userId.email || 'Not specified',
          phoneNumber: formattedApp.userId.phoneNumber || 'Not specified',
          skills: formattedApp.userId.skills || [],
          experience: formattedApp.userId.experience || 'Not specified'
        } : {
          name: 'User information unavailable',
          email: 'No email available',
          phoneNumber: 'Not available',
          skills: [],
          experience: 'Not specified'
        },
        status: formattedApp.status || 'pending'
      };
    });

    const stats = {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      reviewed: applications.filter(app => app.status === 'reviewed').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      rejected: applications.filter(app => app.status === 'rejected').length
    };

    res.json({ applications: formattedApplications, stats });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Error updating application status' });
  }
});

module.exports = router;
