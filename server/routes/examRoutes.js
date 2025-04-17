const express = require('express');
const router = express.Router();
const { protect, requireAdmin, restrictTo } = require('../middleware/authMiddleware');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const JobPosting = require('../models/JobPosting');
const codeExecutionService = require('../services/codeExecutionService');
const examController = require('../controllers/examController');
const { validateExamInput } = require('../middleware/inputValidator');

// Admin Routes - Exam Management
router.post('/jobs/:jobId/exam', protect, requireAdmin, async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const { 
      name, 
      description, 
      totalDuration, 
      passingCriteria, 
      aptitudeRound, 
      codingRound,
      questions 
    } = req.body;

    console.log('Creating exam for job:', jobId, {
      name,
      totalDuration,
      questionCount: questions?.length
    });

    // Check if job exists
    const job = await JobPosting.findById(jobId);
    if (!job) {
      console.log('Job not found:', jobId);
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if exam already exists for this job
    const existingExam = await Exam.findOne({ jobId });
    if (existingExam) {
      console.log('Exam already exists for job:', jobId);
      return res.status(400).json({ message: 'Exam already exists for this job' });
    }

    // Validate required fields
    if (!name || !totalDuration || !passingCriteria || !questions || !questions.length) {
      console.log('Missing required exam fields');
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['name', 'totalDuration', 'passingCriteria', 'questions']
      });
    }

    // Create new exam with versioned questions
    const exam = new Exam({
      jobId,
      name,
      description,
      totalDuration,
      passingCriteria,
      questions: questions.map(q => ({
        questionId: q.questionId,
        version: q.version || 1
      })),
      aptitudeConfig: aptitudeRound || { enabled: false },
      codingConfig: codingRound || { enabled: false },
      createdBy: req.user.id,
      status: 'active'
    });

    await exam.save();

    // Update job with exam reference
    job.exam = exam._id;
    await job.save();

    console.log('Exam created successfully:', exam._id);
    res.status(201).json(exam);
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ 
      message: 'Error creating exam', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.get('/jobs/:jobId/exam', protect, async (req, res) => {
  try {
    const exam = await Exam.findOne({ jobId: req.params.jobId });
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // If user is not admin, only return basic exam info
    if (req.userRole !== 'admin') {
      const basicInfo = {
        name: exam.name,
        description: exam.description,
        totalDuration: exam.totalDuration,
        status: exam.status
      };
      return res.json(basicInfo);
    }

    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exam', error: error.message });
  }
});

router.put('/jobs/:jobId/exam', protect, requireAdmin, async (req, res) => {
  try {
    const exam = await Exam.findOne({ jobId: req.params.jobId });
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Update exam fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'jobId' && key !== 'createdBy') {
        exam[key] = req.body[key];
      }
    });

    await exam.save();
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: 'Error updating exam', error: error.message });
  }
});

router.delete('/jobs/:jobId/exam', protect, requireAdmin, async (req, res) => {
  try {
    const exam = await Exam.findOne({ jobId: req.params.jobId });
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Remove exam reference from job
    await JobPosting.findByIdAndUpdate(req.params.jobId, { $unset: { exam: 1 } });

    // Delete exam
    await exam.remove();
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting exam', error: error.message });
  }
});

// Candidate Routes - Exam Attempts
router.post('/jobs/:jobId/exam/start', protect, async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const exam = await Exam.findOne({ jobId });
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if candidate has already attempted the exam
    const existingAttempt = await ExamAttempt.findOne({
      examId: exam._id,
      userId: req.user._id
    });

    if (existingAttempt) {
      return res.status(400).json({ message: 'You have already attempted this exam' });
    }

    // Create new exam attempt
    const attempt = new ExamAttempt({
      examId: exam._id,
      jobId,
      userId: req.user._id,
      aptitudeAttempt: {
        startTime: new Date()
      }
    });

    await attempt.save();
    res.status(201).json(attempt);
  } catch (error) {
    res.status(500).json({ message: 'Error starting exam', error: error.message });
  }
});

router.post('/jobs/:jobId/exam/aptitude/submit', protect, async (req, res) => {
  try {
    const { answers } = req.body;
    const exam = await Exam.findOne({ jobId: req.params.jobId });
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const attempt = await ExamAttempt.findOne({
      examId: exam._id,
      userId: req.user._id
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Exam attempt not found' });
    }

    // Calculate score
    let totalScore = 0;
    const detailedAnswers = answers.map(answer => {
      const question = exam.aptitudeRound.questions.id(answer.questionId);
      const isCorrect = question.correctAnswer === answer.selectedOption;
      const marks = isCorrect ? question.marks : (exam.aptitudeRound.negativeMarking ? -question.negativeMarks : 0);
      totalScore += marks;

      return {
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect,
        marksObtained: marks
      };
    });

    // Update attempt
    attempt.aptitudeAttempt.answers = detailedAnswers;
    attempt.aptitudeAttempt.totalScore = totalScore;
    attempt.aptitudeAttempt.endTime = new Date();
    attempt.aptitudeAttempt.status = 'completed';

    // Check if candidate passed aptitude round
    if (totalScore >= exam.aptitudeRound.passingScore) {
      attempt.overallStatus = 'aptitude_completed';
      attempt.codingAttempt.startTime = new Date();
    } else {
      attempt.overallStatus = 'failed';
      attempt.result = 'fail';
    }

    await attempt.save();
    res.json(attempt);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting aptitude answers', error: error.message });
  }
});

// Submit coding solutions
router.post('/jobs/:jobId/exam/coding/submit', protect, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { solutions } = req.body;
    const userId = req.user._id;

    // Find the exam attempt
    const attempt = await ExamAttempt.findOne({
      jobId,
      userId,
      'codingAttempt.status': { $ne: 'completed' }
    }).populate('examId');

    if (!attempt) {
      return res.status(404).json({ message: 'No active exam attempt found' });
    }

    const exam = await Exam.findById(attempt.examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Validate solutions
    if (!Array.isArray(solutions) || solutions.length !== exam.codingRound.problems.length) {
      return res.status(400).json({ message: 'Invalid solutions format' });
    }

    // Process each solution
    const processedProblems = await Promise.all(
      solutions.map(async (solution, index) => {
        const problem = exam.codingRound.problems[index];
        
        // Run test cases
        const testResults = await codeExecutionService.runCode(
          solution.code,
          solution.language,
          problem.testCases
        );

        // Calculate score for this problem
        const problemScore = codeExecutionService.calculateScore(
          testResults,
          problem.totalScore
        );

        return {
          problemId: problem._id,
          language: solution.language,
          code: solution.code,
          testResults,
          totalScore: problemScore
        };
      })
    );

    // Calculate total coding score
    const totalCodingScore = processedProblems.reduce(
      (sum, problem) => sum + problem.totalScore,
      0
    );

    // Update attempt
    attempt.codingAttempt = {
      ...attempt.codingAttempt,
      problems: processedProblems,
      totalScore: totalCodingScore,
      status: 'completed',
      endTime: new Date()
    };

    // Calculate final score and result
    const finalScore = Math.round(
      (attempt.aptitudeAttempt.totalScore + totalCodingScore) / 2
    );

    attempt.finalScore = finalScore;
    attempt.result = finalScore >= exam.passingCriteria ? 'pass' : 'fail';
    attempt.overallStatus = 'completed';

    await attempt.save();

    res.json(attempt);
  } catch (error) {
    console.error('Error submitting coding solutions:', error);
    res.status(500).json({ message: 'Error submitting coding solutions' });
  }
});

router.get('/jobs/:jobId/exam/status', protect, async (req, res) => {
  try {
    const exam = await Exam.findOne({ jobId: req.params.jobId });
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const attempt = await ExamAttempt.findOne({
      examId: exam._id,
      userId: req.user._id
    });

    if (!attempt) {
      return res.json({ status: 'not_started' });
    }

    res.json({
      status: attempt.overallStatus,
      result: attempt.result,
      finalScore: attempt.finalScore
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exam status', error: error.message });
  }
});

// Helper function for code execution
async function executeCodeAgainstTestCases(code, language, testCases) {
  // This is a placeholder for actual code execution logic
  // In a real implementation, this would use a secure code execution service
  return testCases.map(testCase => ({
    testCaseId: testCase._id,
    passed: true, // Placeholder
    output: 'Sample output', // Placeholder
    error: null,
    executionTime: 100, // ms
    memoryUsed: 50 // MB
  }));
}

// Submit exam
router.post('/submit', validateExamInput, examController.submitExam);

// Get exam status
router.get('/status/:jobId', examController.getExamStatus);

module.exports = router;