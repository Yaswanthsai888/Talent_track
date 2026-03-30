const express = require('express');
const expressWinston = require('express-winston');
const router = express.Router();
const { getAllUsers } = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, admin, getAllUsers);

module.exports = router;
