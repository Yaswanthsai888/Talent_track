const promClient = require('prom-client');

// Create metrics
const activeTests = new promClient.Gauge({
  name: 'active_tests_total',
  help: 'Number of currently active tests'
});

const testScores = new promClient.Summary({
  name: 'test_scores',
  help: 'Distribution of test scores'
});

const testCompletionRate = new promClient.Gauge({
  name: 'test_completion_rate',
  help: 'Percentage of tests completed successfully'
});

module.exports = {
  activeTests,
  testScores,
  testCompletionRate,
  
  // Update metrics
  updateMetrics: async () => {
    const TestAttempt = require(../models/TestAttempt');
    
    // Update active tests
    const activeCount = await TestAttempt.countDocuments({ status: 'in_progress' });
    activeTests.set(activeCount);

    // Update completion rate
    const total = await TestAttempt.countDocuments();
    const completed = await TestAttempt.countDocuments({ status: 'submitted' });
    testCompletionRate.set((completed / total) * 100);
  }
};
