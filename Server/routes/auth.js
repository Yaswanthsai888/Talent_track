const express = require('express');
const expressWinston = require('express-winston');
const router = express.Router();
const logger = require('../utils/logger');
const { register, login, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getUserProfile);

module.exports = router;
