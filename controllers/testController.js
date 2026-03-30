const Test = require('../models/Test');
const Question = require('../models/Question');
const TestAttempt = require('../models/TestAttempt');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

exports.createTest = asyncHandler(async (req, res, next) => {
  const { jobId, testType, difficultyLevel, numberOfQuestions, timeLimit, schedule, questions } = req.body;

  // Validate required fields
  if (!jobId || !testType) {
    return next(new ErrorResponse('Please provide jobId and testType', 400));
  }

  // Check if job exists
  const job = await Job.findById(jobId);
  if (!job) {
    return next(new ErrorResponse('Job not found', 404));
  }

  const test = await Test.create({
    jobId,
    testType,
    difficultyLevel,
    numberOfQuestions,
    timeLimit,
    schedule,
    questions,
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    data: test
  });
});

exports.startTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId);
    
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    // Check if test is within schedule
    const now = new Date();
    if (now < test.schedule.startDate || now > test.schedule.endDate) {
      return res.status(400).json({
        success: false,
        error: 'Test is not currently available'
      });
    }

    const testAttempt = await TestAttempt.create({
      testId,
      userId: req.user.id,
      startTime: now
    });

    res.status(200).json({
      success: true,
      data: testAttempt
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.submitTest = async (req, res) => {
  try {
    const { testAttemptId } = req.params;
    const { answers } = req.body;
    
    const testAttempt = await TestAttempt.findById(testAttemptId);
    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        error: 'Test attempt not found'
      });
    }

    testAttempt.answers = answers;
    testAttempt.endTime = new Date();
    testAttempt.status = 'submitted';
    testAttempt.timeTaken = (testAttempt.endTime - testAttempt.startTime) / (1000 * 60); // Convert to minutes

    await testAttempt.save();

    res.status(200).json({
      success: true,
      data: testAttempt
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getTests = async (req, res) => {
  try {
    const tests = await Test.find({ createdBy: req.user.id })
      .populate('jobId')
      .populate('questions');
    
    res.status(200).json({
      success: true,
      data: tests
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId)
      .populate('questions');
    
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    res.status(200).json({
      success: true,
      data: test
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const question = await Question.create(req.body);
    
    res.status(201).json({
      success: true,
      data: question
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const { type, difficulty, topic } = req.query;
    let query = {};
    
    if (type) query.type = type;
    if (difficulty) query.difficultyLevel = difficulty;
    if (topic) query.topic = topic;

    const questions = await Question.find(query);
    
    res.status(200).json({
      success: true,
      data: questions
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getTestAttempt = async (req, res) => {
  try {
    const attempt = await TestAttempt.findById(req.params.testAttemptId)
      .populate('testId')
      .populate('answers.questionId');
    
    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'Test attempt not found'
      });
    }

    // Only allow access to own attempts or admin
    if (attempt.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this attempt'
      });
    }

    res.status(200).json({
      success: true,
      data: attempt
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.importQuestions = async (req, res) => {
  try {
    const { questions } = req.body;
    const created = await Question.insertMany(questions);
    
    res.status(201).json({
      success: true,
      data: created
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.exportQuestions = async (req, res) => {
  try {
    const questions = await Question.find(req.query);
    
    res.status(200).json({
      success: true,
      data: questions
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.saveTemplate = async (req, res) => {
  try {
    const template = new Test({
      ...req.body,
      isTemplate: true,
      createdBy: req.user.id
    });
    await template.save();
    
    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const templates = await Test.find({ 
      isTemplate: true,
      createdBy: req.user.id 
    });
    
    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
