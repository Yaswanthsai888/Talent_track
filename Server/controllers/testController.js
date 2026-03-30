const asyncHandler = require('express-async-handler');
const Test = require('../models/Test');

const getTests = asyncHandler(async (req, res) => {
    const tests = await Test.find({});
    res.json({ success: true, data: tests });
});

const createTest = asyncHandler(async (req, res) => {
    const test = await Test.create(req.body);
    res.status(201).json({ success: true, data: test });
});

const getTestById = asyncHandler(async (req, res) => {
    const test = await Test.findById(req.params.id);
    if (!test) {
        res.status(404);
        throw new Error('Test not found');
    }
    res.json({ success: true, data: test });
});

const updateTest = asyncHandler(async (req, res) => {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!test) {
        res.status(404);
        throw new Error('Test not found');
    }
    res.json({ success: true, data: test });
});

const deleteTest = asyncHandler(async (req, res) => {
    const test = await Test.findByIdAndDelete(req.params.id);
    if (!test) {
        res.status(404);
        throw new Error('Test not found');
    }
    res.json({ success: true, message: 'Test deleted' });
});

const startTestAttempt = asyncHandler(async (req, res) => {
    const test = await Test.findById(req.params.testId);
    if (!test) {
        res.status(404);
        throw new Error('Test not found');
    }
    // Add test attempt logic here
    res.json({ success: true, message: 'Test started' });
});

const submitTestAttempt = asyncHandler(async (req, res) => {
    // Add submission logic here
    res.json({ success: true, message: 'Test submitted' });
});

const getTestResults = asyncHandler(async (req, res) => {
    // Add results retrieval logic here
    res.json({ success: true, data: {} });
});

module.exports = {
    getTests,
    createTest,
    getTestById,
    updateTest,
    deleteTest,
    startTestAttempt,
    submitTestAttempt,
    getTestResults
};
