const User = require('../models/User');
const TestAttempt = require('../models/TestAttempt');
const asyncHandler = require('express-async-handler');

// @desc    Get ranked candidates for a specific test
// @route   GET /api/ranking/tests/:testId
// @access  Private
const getTestRankings = asyncHandler(async (req, res) => {
    const { testId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const candidates = await TestAttempt.aggregate([
        { $match: { testId: testId, evaluationStatus: 'completed' } },
        { $sort: { 'score': -1, submittedAt: 1 } },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        },
        { $unwind: '$user' },
        {
            $project: {
                candidateName: '$user.name',
                email: '$user.email',
                score: 1,
                timeTaken: 1,
                submittedAt: 1,
                selected: '$selectedForNextRound'
            }
        },
        { $skip: skip },
        { $limit: parseInt(limit) }
    ]);

    const total = await TestAttempt.countDocuments({
        testId,
        evaluationStatus: 'completed'
    });

    res.json({
        success: true,
        data: {
            candidates,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        }
    });
});

// @desc    Get overall user rankings
// @route   GET /api/ranking/users
// @access  Private
const getUserRankings = asyncHandler(async (req, res) => {
    const { limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const userRankings = await TestAttempt.aggregate([
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
                as: 'user'
            }
        },
        { $unwind: '$user' },
        {
            $project: {
                name: '$user.name',
                email: '$user.email',
                totalTests: 1,
                averageScore: 1,
                bestScore: 1
            }
        },
        { $sort: { averageScore: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
    ]);

    const total = await User.countDocuments();

    res.json({
        success: true,
        data: {
            rankings: userRankings,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        }
    });
});

module.exports = {
    getTestRankings,
    getUserRankings
};
