import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TestAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalAttempts: 0,
    averageScore: 0,
    completionRate: 0,
    testData: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('/api/analytics/tests');
      setAnalytics(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="analytics-container"
    >
      <h2>Test Analytics Dashboard</h2>
      
      <div className="analytics-grid">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="stat-card"
        >
          <h3>Total Attempts</h3>
          <p>{analytics.totalAttempts}</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="stat-card"
        >
          <h3>Average Score</h3>
          <p>{analytics.averageScore.toFixed(2)}%</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="stat-card"
        >
          <h3>Completion Rate</h3>
          <p>{analytics.completionRate.toFixed(2)}%</p>
        </motion.div>
      </div>

      <div className="charts-container">
        <div className="chart">
          <h3>Performance Trends</h3>
          <Line data={analytics.performanceData} />
        </div>
        <div className="chart">
          <h3>Question Difficulty Distribution</h3>
          <Bar data={analytics.difficultyData} />
        </div>
      </div>

      <div className="analytics-overview">
        <h3>Analytics Overview</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Average Score</h4>
            <p>{analytics.averageScore?.toFixed(2)}%</p>
          </div>
          <div className="stat-card">
            <h4>Pass Rate</h4>
            <p>{analytics.passRate?.toFixed(2)}%</p>
          </div>
          <div className="stat-card">
            <h4>Total Evaluated</h4>
            <p>{analytics.totalEvaluated}</p>
          </div>
        </div>

        {analytics.performanceData && (
          <div className="chart-container">
            <h4>Performance Trends</h4>
            <Line data={analytics.performanceData} />
          </div>
        )}
      </div>

      <div className="advanced-analytics">
        <section className="performance-trends">
          <h3>Performance Trends</h3>
          <Line
            data={{
              labels: analytics.performanceTrends?.labels || [],
              datasets: [
                {
                  label: 'Average Score',
                  data: analytics.performanceTrends?.averageScores || [],
                  borderColor: 'rgb(75, 192, 192)',
                  tension: 0.1
                },
                {
                  label: 'Number of Attempts',
                  data: analytics.performanceTrends?.attempts || [],
                  borderColor: 'rgb(255, 99, 132)',
                  tension: 0.1
                }
              ]
            }}
          />
        </section>

        <section className="question-difficulty">
          <h3>Question Difficulty Analysis</h3>
          <div className="difficulty-grid">
            {analytics.questionDifficulty?.map((q, i) => (
              <div key={i} className={`difficulty-card ${q.difficulty.toLowerCase()}`}>
                <h4>Question {i + 1}</h4>
                <p>Difficulty: {q.difficulty}</p>
                <p>Average Score: {q.averageScore.toFixed(2)}%</p>
                <p>Time Spent: {q.timeSpent.toFixed(1)} mins</p>
              </div>
            ))}
          </div>
        </section>

        <section className="comparative-analysis">
          <h3>Comparative Analysis</h3>
          <Bar
            data={{
              labels: analytics.comparativeAnalysis?.similarTests.map(t => t.testName) || [],
              datasets: [
                {
                  label: 'Average Score',
                  data: analytics.comparativeAnalysis?.similarTests.map(t => t.averageScore) || [],
                  backgroundColor: 'rgba(53, 162, 235, 0.5)',
                }
              ]
            }}
          />
          <div className="benchmark-info">
            <p>Benchmark Average Score: {analytics.comparativeAnalysis?.benchmark.averageScore.toFixed(2)}%</p>
            <p>Average Attempts per Test: {analytics.comparativeAnalysis?.benchmark.averageAttempts.toFixed(1)}</p>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default TestAnalytics;
