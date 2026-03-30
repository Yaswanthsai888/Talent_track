const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { 
    getUserAnalytics, 
    getJobAnalytics, 
    getTestAnalytics 
} = require('../controllers/analyticsController');

router.route('/users')
  .get(protect, admin, getUserAnalytics);

router.route('/jobs')
  .get(protect, admin, getJobAnalytics);

router.route('/tests')
  .get(protect, admin, getTestAnalytics);

module.exports = router;
