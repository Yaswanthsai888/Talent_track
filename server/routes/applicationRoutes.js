const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const JobApplication = require('../models/JobApplication');

// ...existing code...

module.exports = router;
