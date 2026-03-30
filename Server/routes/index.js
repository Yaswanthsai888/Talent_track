const express = require('express');
const routeConfig = require('../config/routes');

const authRoutes = require('./auth');
const userRoutes = require('./users');
const jobRoutes = require('./jobs');
const testRoutes = require('./tests');
const userTestRoutes = require('./user-tests');
const evaluationRoutes = require('./evaluation');
const analyticsRoutes = require('./analytics');
const rankingRoutes = require('./ranking');

const router = express.Router();

// Centralized route management
router.use(routeConfig.ROUTES.AUTH, authRoutes);
router.use(routeConfig.ROUTES.USERS, userRoutes);
router.use(routeConfig.ROUTES.JOBS, jobRoutes);
router.use(routeConfig.ROUTES.TESTS, testRoutes);
router.use(routeConfig.ROUTES.USER_TESTS, userTestRoutes);
router.use(routeConfig.ROUTES.EVALUATIONS, evaluationRoutes);
router.use(routeConfig.ROUTES.ANALYTICS, analyticsRoutes);
router.use(routeConfig.ROUTES.RANKING, rankingRoutes);

module.exports = router;
