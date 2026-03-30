const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
    getTests,
    createTest,
    getTestById,
    updateTest,
    deleteTest,
    startTestAttempt,
    submitTestAttempt,
    getTestResults
} = require('../controllers/testController');

// Test Creation and Management Routes
router.route('/')
    .get(protect, getTests)
    .post(protect, admin, createTest);

// Test Health Check
router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Specific Test Routes
router.route('/:id')
    .get(protect, getTestById)
    .put(protect, admin, updateTest)
    .delete(protect, admin, deleteTest);

// Test Attempt Routes
router.post('/:testId/start', protect, startTestAttempt);
router.post('/:testId/submit', protect, submitTestAttempt);

// Test Results Route
router.get('/:testId/results', protect, getTestResults);

module.exports = router;
