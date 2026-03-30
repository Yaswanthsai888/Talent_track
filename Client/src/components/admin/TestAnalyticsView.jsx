import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTestAnalytics } from '../../services/analyticsService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TestAnalyticsView = () => {
  const { testId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [testId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getTestAnalytics(testId);
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading analytics...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!analytics) return <div>No analytics available</div>;

  const scoreDistributionData = {
    labels: Object.keys(analytics.scoreDistribution),
    datasets: [{
      label: 'Number of Students',
      data: Object.values(analytics.scoreDistribution),
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
    }]
  };

  return (
    <div className="analytics-container">
      <h2>Test Analytics</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Attempts</h3>
          <p>{analytics.totalAttempts}</p>
        </div>
        <div className="stat-card">
          <h3>Average Score</h3>
          <p>{analytics.averageScore.toFixed(2)}%</p>
        </div>
        <div className="stat-card">
          <h3>Average Time</h3>
          <p>{analytics.averageTime.toFixed(2)} minutes</p>
        </div>
      </div>

      <div className="charts-section">
        <h3>Score Distribution</h3>
        <Bar data={scoreDistributionData} />
      </div>

      <div className="recent-submissions">
        <h3>Recent Submissions</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Score</th>
              <th>Time Taken</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {analytics.recentSubmissions.map((submission, index) => (
              <tr key={index}>
                <td>{submission.userName}</td>
                <td>{submission.score}%</td>
                <td>{submission.timeTaken} mins</td>
                <td>{new Date(submission.submittedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TestAnalyticsView;
