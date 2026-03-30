const asyncHandler = require('express-async-handler');
const UserTest = require('../models/UserTest');
const Test = require('../models/Test');

// @desc    Get user's tests
// @route   GET /api/user/tests
// @access  Private
const getUserTests = asyncHandler(async (req, res) => {
    const userTests = await UserTest.find({ user: req.user._id })
        .populate('test', 'title description timeLimit');

    res.json({
        success: true,
        data: userTests
    });
});

// @desc    Start a test
// @route   POST /api/user/tests/:testId/start
// @access  Private
const startUserTest = asyncHandler(async (req, res) => {
    const test = await Test.findById(req.params.testId);

    if (!test) {
        res.status(404);
        throw new Error('Test not found');
    }

    const userTest = await UserTest.create({
        user: req.user._id,
        test: req.params.testId,
        startTime: Date.now(),
        status: 'in_progress'
    });

    res.status(201).json({
        success: true,
        data: userTest
    });
});

// @desc    Submit a test
// @route   POST /api/user/tests/:testId/submit
// @access  Private
const submitUserTest = asyncHandler(async (req, res) => {
    const { answers } = req.body;

    const userTest = await UserTest.findOne({ 
        user: req.user._id, 
        test: req.params.testId,
        status: 'in_progress'
    });

    if (!userTest) {
        res.status(404);
        throw new Error('Active test not found');
    }

    // Calculate score
    const test = await Test.findById(req.params.testId);
    let score = 0;
    test.questions.forEach((question, index) => {
        if (question.correctAnswer === answers[index]) {
            score++;
        }
    });

    userTest.score = (score / test.questions.length) * 100;
    userTest.status = 'completed';
    userTest.submittedAnswers = answers;
    userTest.endTime = Date.now();

    await userTest.save();

    res.json({
        success: true,
        data: userTest
    });
});

module.exports = {
    getUserTests,
    startUserTest,
    submitUserTest
};
