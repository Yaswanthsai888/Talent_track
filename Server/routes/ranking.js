const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
    getUserRankings, 
    getTestRankings 
} = require('../controllers/rankingController');

router.route('/users')
  .get(protect, getUserRankings);

router.route('/tests/:testId')
  .get(protect, getTestRankings);

module.exports = router;
