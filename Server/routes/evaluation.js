const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { 
    getEvaluations, 
    getEvaluationById, 
    createEvaluation 
} = require('../controllers/evaluationController');

router.route('/')
    .get(protect, admin, getEvaluations)
    .post(protect, admin, createEvaluation);

router.route('/:id')
    .get(protect, admin, getEvaluationById);

module.exports = router;
