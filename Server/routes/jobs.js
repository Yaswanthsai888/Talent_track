const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { 
    createJob, 
    getAllJobs, 
    getJobById, 
    updateJob, 
    deleteJob,
    getAdminJobs  // Add this
} = require('../controllers/jobController');

router.route('/')
    .get(protect, getAllJobs)
    .post(protect, admin, createJob);

// Admin jobs route
router.get('/my-postings', protect, admin, getAdminJobs);  // Add this route

router.route('/:id')
    .get(protect, getJobById)
    .put(protect, admin, updateJob)
    .delete(protect, admin, deleteJob);

module.exports = router;
