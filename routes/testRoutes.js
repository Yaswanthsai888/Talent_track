const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { protect, authorize } = require('../middleware/auth');

// Test routes
router.route('/tests')
  .post(protect, authorize('admin'), testController.createTest)
  .get(protect, authorize('admin'), testController.getTests);

router.route('/tests/:testId')
  .get(protect, testController.getTestById)
  .put(protect, authorize('admin'), testController.updateTest)
  .delete(protect, authorize('admin'), testController.deleteTest);

// Question routes
router.route('/questions')
  .post(protect, authorize('admin'), testController.createQuestion)
  .get(protect, authorize('admin'), testController.getQuestions);

// Question import/export routes
router.route('/questions/import')
  .post(protect, authorize('admin'), testController.importQuestions);

router.route('/questions/export')
  .get(protect, authorize('admin'), testController.exportQuestions);

// Test attempt routes
router.route('/tests/:testId/start')
  .post(protect, testController.startTest);

router.route('/attempts/:testAttemptId/submit')
  .post(protect, testController.submitTest);

router.route('/attempts/:testAttemptId')
  .get(protect, testController.getTestAttempt);

// Template routes
router.route('/tests/templates')
  .get(protect, authorize('admin'), testController.getTemplates)
  .post(protect, authorize('admin'), testController.saveTemplate);

// Analytics routes
router.get('/analytics/tests', 
  protect, 
  authorize('admin'), 
  analyticsController.getTestAnalytics
);

module.exports = router;
