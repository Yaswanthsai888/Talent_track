import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import TestAnalytics from './TestAnalytics';
import TestAnalyticsView from './TestAnalyticsView';
import '../../styles/analytics.css';
import { Tabs, Tab } from '../common/Tabs';
import RealTimeEvaluation from '../RealTimeEvaluation';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalTests: 0,
    activeTests: 0,
    pendingEvaluations: 0,
    recentSubmissions: []
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await axios.get('/api/admin/dashboard');
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <div className="action-buttons">
          <Link to="/admin/tests/create" className="btn btn-primary">
            Create New Test
          </Link>
          <Link to="/admin/questions" className="btn btn-secondary">
            Manage Questions
          </Link>
        </div>
      </div>

      <Tabs defaultTab="overview">
        <Tab label="Overview" value="overview">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Tests</h3>
              <p>{stats.totalTests}</p>
            </div>
            <div className="stat-card">
              <h3>Active Tests</h3>
              <p>{stats.activeTests}</p>
            </div>
            <div className="stat-card">
              <h3>Evaluations Pending</h3>
              <p>{stats.pendingEvaluations}</p>
            </div>
          </div>
          <TestAnalytics />
        </Tab>

        <Tab label="Active Tests" value="tests">
          <div className="active-tests">
            {stats.recentSubmissions.map(submission => (
              <div key={submission._id} className="test-card">
                <h3>{submission.testName}</h3>
                <div className="test-meta">
                  <span>{submission.candidateName}</span>
                  <span>{new Date(submission.submittedAt).toLocaleString()}</span>
                </div>
                <RealTimeEvaluation 
                  testId={submission.testId} 
                  answerId={submission._id} 
                />
                <div className="actions">
                  <Link to={`/admin/tests/${submission.testId}/results`}>
                    View Results
                  </Link>
                  <Link to={`/admin/tests/${submission.testId}/analytics`}>
                    View Analytics
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Tab>

        <Tab label="Analytics" value="analytics">
          <TestAnalyticsView />
        </Tab>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
