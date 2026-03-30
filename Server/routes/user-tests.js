const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
    getUserTests, 
    startUserTest, 
    submitUserTest 
} = require('../controllers/userTestController');

router.route('/')
  .get(protect, getUserTests);

router.route('/:testId/start')
  .post(protect, startUserTest);

router.route('/:testId/submit')
  .post(protect, submitUserTest);

module.exports = router;
