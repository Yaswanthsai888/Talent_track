import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const UserDashboard = () => {
  const [tests, setTests] = useState({
    upcoming: [],
    completed: [],
    available: []
  });

  const [userStats, setUserStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    testsCompleted: 0
  });

  useEffect(() => {
    fetchUserTests();
    fetchUserStats();
  }, []);

  const fetchUserTests = async () => {
    try {
      const res = await axios.get('/api/user/tests');
      setTests(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserStats = async () => {
    try {
      const res = await axios.get('/api/user/test-stats');
      setUserStats(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h2>My Tests Dashboard</h2>
      </div>

      <div className="user-stats">
        <div className="stat-card">
          <h3>Tests Taken</h3>
          <p>{userStats.totalAttempts}</p>
        </div>
        <div className="stat-card">
          <h3>Average Score</h3>
          <p>{userStats.averageScore}%</p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p>{userStats.testsCompleted}</p>
        </div>
      </div>

      <div className="available-tests">
        <h3>Available Tests</h3>
        <div className="tests-grid">
          {tests.available.map(test => (
            <div key={test._id} className="test-card">
              <h4>{test.title}</h4>
              <p>Type: {test.testType}</p>
              <p>Duration: {test.timeLimit} minutes</p>
              <Link 
                to={`/tests/${test._id}`}
                className="start-test-btn"
              >
                Start Test
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="upcoming-tests">
        <h3>Upcoming Tests</h3>
        <div className="tests-grid">
          {tests.upcoming.map(test => (
            <div key={test._id} className="test-card upcoming">
              <h4>{test.title}</h4>
              <p>Available from: {new Date(test.schedule.startDate).toLocaleString()}</p>
              <p>Duration: {test.timeLimit} minutes</p>
            </div>
          ))}
        </div>
      </div>

      <div className="completed-tests">
        <h3>Completed Tests</h3>
        <table>
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Date</th>
              <th>Score</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tests.completed.map(test => (
              <tr key={test._id}>
                <td>{test.title}</td>
                <td>{new Date(test.completedAt).toLocaleString()}</td>
                <td>{test.score}%</td>
                <td>{test.status}</td>
                <td>
                  <Link to={`/tests/${test._id}/results`}>
                    View Results
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserDashboard;
