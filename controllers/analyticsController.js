const TestAttempt = require('../models/TestAttempt');
const Test = require('../models/Test');

exports.getTestAnalytics = async (req, res) => {
  try {
    const totalAttempts = await TestAttempt.countDocuments();
    
    const attempts = await TestAttempt.find()
      .populate('testId')
      .populate('answers.questionId');

    // Calculate statistics
    const completedAttempts = attempts.filter(a => a.status === 'submitted');
    const completionRate = (completedAttempts.length / totalAttempts) * 100;

    // Get performance data over time
    const performanceData = await TestAttempt.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
          averageScore: { $avg: "$score" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get difficulty distribution
    const difficultyData = await Test.aggregate([
      {
        $group: {
          _id: "$difficultyLevel",
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalAttempts,
        completionRate,
        performanceData,
        difficultyData,
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
