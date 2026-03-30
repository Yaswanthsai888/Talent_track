const TestAttempt = require('../models/TestAttempt');
const cache = require('../config/cache');
const asyncHandler = require('express-async-handler');

// Helper functions for analytics
const calculateAverageScore = (attempts) => {
    if (attempts.length === 0) return 0;
    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    return totalScore / attempts.length;
};

const calculateScoreDistribution = (attempts) => {
    const distribution = {
        '0-20': 0,
        '21-40': 0,
        '41-60': 0,
        '61-80': 0,
        '81-100': 0
    };

    attempts.forEach(attempt => {
        if (attempt.score < 20) distribution['0-20']++;
        else if (attempt.score < 40) distribution['21-40']++;
        else if (attempt.score < 60) distribution['41-60']++;
        else if (attempt.score < 80) distribution['61-80']++;
        else distribution['81-100']++;
    });

    return distribution;
};

const getRecentSubmissions = (attempts, limit = 10) => {
    return attempts
        .sort((a, b) => b.submittedAt - a.submittedAt)
        .slice(0, limit)
        .map(attempt => ({
            userId: attempt.userId,
            userName: attempt.userId.name,
            score: attempt.score,
            submittedAt: attempt.submittedAt
        }));
};

const calculateQuestionStats = async (testId) => {
    const attempts = await TestAttempt.find({ 
        testId, 
        evaluationStatus: 'completed' 
    });

    const questionStats = {};
    attempts.forEach(attempt => {
        attempt.score.individual.forEach(questionScore => {
            const questionId = questionScore.questionId.toString();
            if (!questionStats[questionId]) {
                questionStats[questionId] = {
                    correctCount: 0,
                    totalAttempts: 0
                };
            }
            questionStats[questionId].totalAttempts++;
            if (questionScore.score > 0) {
                questionStats[questionId].correctCount++;
            }
        });
    });

    return questionStats;
};

const calculatePerformanceTrends = async (testId) => {
    const attempts = await TestAttempt.find({ 
        testId, 
        evaluationStatus: 'completed' 
    }).sort({ submittedAt: 1 });

    const trends = [];
    let rollingAverage = 0;
    const windowSize = 5;

    attempts.forEach((attempt, index) => {
        rollingAverage = (rollingAverage * Math.min(index, windowSize - 1) + attempt.score) / 
            Math.min(index + 1, windowSize);

        trends.push({
            date: attempt.submittedAt,
            score: attempt.score,
            rollingAverage
        });
    });

    return trends;
};

// @desc    Get test analytics
// @route   GET /api/analytics/tests
// @access  Private/Admin
const getTestAnalytics = asyncHandler(async (req, res) => {
    const { testId } = req.query;
    const cacheKey = `analytics:test:${testId}`;
    
    // Try to get from cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
        return res.json({ success: true, data: cachedData });
    }

    const attempts = await TestAttempt.find({ 
        testId, 
        evaluationStatus: 'completed' 
    }).populate('userId', 'name');

    const analytics = {
        totalAttempts: attempts.length,
        averageScore: calculateAverageScore(attempts),
        scoreDistribution: calculateScoreDistribution(attempts),
        recentSubmissions: getRecentSubmissions(attempts),
        questionStats: await calculateQuestionStats(testId),
        performanceTrends: await calculatePerformanceTrends(testId)
    };

    // Cache the results
    await cache.set(cacheKey, analytics, 300); // Cache for 5 minutes

    res.json({ success: true, data: analytics });
});

// @desc    Get user analytics
// @route   GET /api/analytics/users
// @access  Private/Admin
const getUserAnalytics = asyncHandler(async (req, res) => {
    const userAnalytics = await TestAttempt.aggregate([
        {
            $group: {
                _id: '$userId',
                totalTests: { $sum: 1 },
                averageScore: { $avg: '$score' },
                bestScore: { $max: '$score' }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'userDetails'
            }
        },
        { $unwind: '$userDetails' }
    ]);

    res.json({ 
        success: true, 
        data: userAnalytics 
    });
});

// @desc    Get job analytics
// @route   GET /api/analytics/jobs
// @access  Private/Admin
const getJobAnalytics = asyncHandler(async (req, res) => {
    const jobAnalytics = await TestAttempt.aggregate([
        {
            $lookup: {
                from: 'jobs',
                localField: 'jobId',
                foreignField: '_id',
                as: 'jobDetails'
            }
        },
        { $unwind: '$jobDetails' },
        {
            $group: {
                _id: '$jobId',
                jobTitle: { $first: '$jobDetails.title' },
                totalApplications: { $sum: 1 },
                averageTestScore: { $avg: '$score' },
                successfulCandidates: { 
                    $sum: { 
                        $cond: [{ $gte: ['$score', 50] }, 1, 0] 
                    } 
                }
            }
        }
    ]);

    res.json({ 
        success: true, 
        data: jobAnalytics 
    });
});

module.exports = {
    getTestAnalytics,
    getUserAnalytics,
    getJobAnalytics
};
