const asyncHandler = require('express-async-handler');
const TestAttempt = require('../models/TestAttempt');
const Test = require('../models/Test');
const Question = require('../models/Question');
const { createSubmission, getSubmissionResult } = require('../services/sandboxService');

// Helper functions
const calculateAverageScore = (attempts) => {
  const scores = attempts.map(a => a.score.total);
  return scores.reduce((a, b) => a + b, 0) / attempts.length;
};

const calculateScoreDistribution = (attempts) => {
  const scores = attempts.map(a => a.score.total);
  const distribution = {};
  for (const score of scores) {
    if (!distribution[score]) {
      distribution[score] = 0;
    }
    distribution[score]++;
  }
  return distribution;
};

const evaluateAptitudeTest = async (answers, questions) => {
  let totalScore = 0;
  const individualScores = [];

  for (const question of questions) {
    const answer = answers[question._id];
    const score = answer === question.content.correctAnswer ? question.maxScore : 0;
    totalScore += score;
    individualScores.push({
      questionId: question._id,
      score,
      maxScore: question.maxScore,
      feedback: score === 0 ? 'Incorrect answer' : 'Correct answer'
    });
  }

  return { totalScore, individualScores };
};

const evaluateCodingTest = async (answers, questions) => {
  let totalScore = 0;
  const individualScores = [];

  for (const question of questions) {
    const answer = answers[question._id];
    const testCases = question.content.testCases;
    let passedTests = 0;

    for (const testCase of testCases) {
      try {
        const token = await createSubmission(answer, question.programmingLanguage, testCase.input);
        
        // Wait for result with timeout
        let result;
        for (let i = 0; i < 10; i++) {
          result = await getSubmissionResult(token);
          if (result.status.id !== 1 && result.status.id !== 2) { // Not queued or processing
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (result.stdout?.trim() === testCase.expectedOutput.trim()) {
          passedTests++;
        }
      } catch (error) {
        console.error('Sandbox error:', error);
      }
    }

    const score = (passedTests / testCases.length) * question.maxScore;
    totalScore += score;
    individualScores.push({
      questionId: question._id,
      score,
      maxScore: question.maxScore,
      feedback: `Passed ${passedTests} out of ${testCases.length} test cases`
    });
  }

  return { totalScore, individualScores };
};

// Main controller functions
const getEvaluations = asyncHandler(async (req, res) => {
  const evaluations = await TestAttempt.find({ status: 'submitted' })
      .populate('test')
      .populate('user', 'name email');
  res.json({
      success: true,
      data: evaluations
  });
});

const getEvaluationById = asyncHandler(async (req, res) => {
  const evaluation = await TestAttempt.findById(req.params.id)
      .populate('test')
      .populate('user', 'name email');
  
  if (!evaluation) {
      res.status(404);
      throw new Error('Evaluation not found');
  }

  res.json({
      success: true,
      data: evaluation
  });
});

const createEvaluation = asyncHandler(async (req, res) => {
  const { testId, answers } = req.body;
  
  const test = await Test.findById(testId);
  if (!test) {
      res.status(404);
      throw new Error('Test not found');
  }

  const questions = await Question.find({ testId });
  
  let evaluationMethod;
  switch (test.testType) {
      case 'aptitude':
          evaluationMethod = evaluateAptitudeTest;
          break;
      case 'coding':
          evaluationMethod = evaluateCodingTest;
          break;
      default:
          throw new Error('Unsupported test type');
  }

  const { totalScore, individualScores } = await evaluationMethod(answers, questions);

  const evaluation = await TestAttempt.create({
      test: testId,
      user: req.user._id,
      answers,
      status: 'submitted',
      score: {
          total: totalScore,
          individual: individualScores
      }
  });

  res.status(201).json({
      success: true,
      data: evaluation
  });
});

const getTestAnalytics = asyncHandler(async (req, res) => {
  const attempts = await TestAttempt.find({ 
      testId: req.params.testId, 
      evaluationStatus: 'completed' 
  }).populate('userId', 'name');

  const analytics = {
      totalAttempts: attempts.length,
      averageScore: calculateAverageScore(attempts),
      scoreDistribution: calculateScoreDistribution(attempts)
  };

  res.json({
      success: true,
      data: analytics
  });
});

module.exports = {
  getEvaluations,
  getEvaluationById,
  createEvaluation,
  getTestAnalytics
};
