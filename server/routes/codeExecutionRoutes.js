const express = require('express');
const router = express.Router();
const codeExecutionController = require('../controllers/codeExecutionController');
const { validateCodeSubmission } = require('../middleware/inputValidator');

// Submit code
router.post('/submit', validateCodeSubmission, codeExecutionController.submitCode);

// Get code execution status
router.get('/status/:jobId', codeExecutionController.getJobStatus);

module.exports = router; 