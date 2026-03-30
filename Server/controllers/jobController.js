const asyncHandler = require('express-async-handler');
const Job = require('../models/Job');

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private/Admin
const createJob = asyncHandler(async (req, res) => {
    try {
        const { 
            title, 
            description, 
            requiredSkills, 
            location, 
            salary,
            employmentType = 'full-time',
            companyName = req.user.name,  // Default to user's name
            applicationDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        } = req.body;

        // Validate and format required skills
        let formattedSkills;
        if (typeof requiredSkills === 'string') {
            formattedSkills = requiredSkills.split(',').map(skill => skill.trim()).filter(Boolean);
        } else if (Array.isArray(requiredSkills)) {
            formattedSkills = requiredSkills.filter(Boolean).map(skill => skill.toString().trim());
        } else {
            throw new Error('Required skills must be a string or array');
        }

        if (formattedSkills.length === 0) {
            throw new Error('At least one required skill must be specified');
        }

        // Create job without skillsText field
        const job = await Job.create({
            title,
            description,
            requiredSkills: formattedSkills,
            createdBy: req.user._id,
            status: 'active',
            salary: {
                min: Number(salary?.min) || 0,
                max: Number(salary?.max) || 0,
                currency: salary?.currency || 'USD'
            },
            location: {
                city: location?.city || '',
                country: location?.country || 'Not Specified',
                isRemote: location?.isRemote || false
            },
            employmentType,
            applicationDeadline,
            companyName
        });

        const populatedJob = await job.populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            data: populatedJob
        });
    } catch (error) {
        console.error('Job creation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create job'
        });
    }
});

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Private
const getAllJobs = asyncHandler(async (req, res) => {
    const jobs = await Job.find({}).populate('postedBy', 'name email');
    res.json(jobs);
});

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Private
const getJobById = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name email');

    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    res.json(job);
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private/Admin
const updateJob = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);

    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    const updatedJob = await Job.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        { new: true, runValidators: true }
    );

    res.json(updatedJob);
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private/Admin
const deleteJob = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);

    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    await job.deleteOne();
    res.json({ message: 'Job removed' });
});

// @desc    Get jobs created by admin
// @route   GET /api/jobs/my-postings
// @access  Private/Admin
const getAdminJobs = asyncHandler(async (req, res) => {
    try {
        const jobs = await Job.find({ createdBy: req.user.id })
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name email');

        res.json({
            success: true,
            data: jobs
        });
    } catch (error) {
        res.status(500);
        throw new Error('Error fetching admin jobs: ' + error.message);
    }
});

module.exports = {
    createJob,
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob,
    getAdminJobs  // Add this
};
