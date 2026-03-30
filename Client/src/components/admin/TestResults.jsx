import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTestResults } from '../../services/evaluationService';

const TestResults = () => {
  const { testId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [testId]);

  const loadResults = async () => {
    try {
      const data = await getTestResults(testId);
      setResults(data);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading results...</div>;
  if (!results) return <div>No results available</div>;

  return (
    <div className="test-results">
      <h2>Test Results</h2>
      <div className="results-summary">
        <div className="stat-card">
          <h3>Submissions</h3>
          <p>{results.totalSubmissions}</p>
        </div>
        <div className="stat-card">
          <h3>Pass Rate</h3>
          <p>{results.passRate}%</p>
        </div>
      </div>

      <div className="candidates-table">
        <h3>Candidate Results</h3>
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Score</th>
              <th>Time Taken</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.submissions.map(sub => (
              <tr key={sub._id}>
                <td>{sub.candidateName}</td>
                <td>{sub.score}%</td>
                <td>{sub.timeTaken} mins</td>
                <td>{sub.status}</td>
                <td>
                  <button onClick={() => window.location.href = `/admin/submission/${sub._id}`}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TestResults;
