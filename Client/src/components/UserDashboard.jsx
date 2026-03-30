import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResumeUpload from './ResumeUpload';
import { 
  getUserProfile, 
  logout, 
  getMatchedJobs, 
  getAllJobs,
  getUserTests,
  getUserTestStats
} from '../services/api';

const UserDashboard = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    skills: []
  });
  const [userTests, setUserTests] = useState([]);
  const [testStats, setTestStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [
          profile, 
          matched, 
          allJobsData, 
          tests, 
          testStatsData
        ] = await Promise.all([
          getUserProfile(),
          getMatchedJobs(),
          getAllJobs(page, 10),
          getUserTests(),
          getUserTestStats()
        ]);
        setUserProfile(profile);
        setMatchedJobs(matched.jobs || []);
        setAllJobs(allJobsData.jobs || []);
        setPagination(allJobsData.pagination);
        
        // Set tests and test stats
        setUserTests(tests.tests || []);
        setTestStats(testStatsData.stats || null);
      } catch (error) {
        setError(error.message || 'Failed to fetch data');
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  if (loading) {
    return (
      <div className="loading-container glass-morphism">
        <div className="loader"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="error-message glass-morphism">
        <p>Failed to load user profile. Please try logging in again.</p>
        <button 
          onClick={() => {
            logout();
            navigate('/login');
          }} 
          className="cyber-button"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <header>
        <h1>Welcome, {userProfile.name}</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      {error && (
        <div className="error-message glass-morphism">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="cyber-button">
            Retry
          </button>
        </div>
      )}

      {/* Profile Section */}
      <section className="user-profile glass-morphism">
        <h2>Your Profile</h2>
        <p>Email: {userProfile.email}</p>
        <p>Role: {userProfile.role}</p>
        
        {userProfile.skills && userProfile.skills.length > 0 && (
          <div className="skills-section">
            <h3>Your Skills</h3>
            <ul>
              {userProfile.skills.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Jobs Section */}
      <section className="jobs-section glass-morphism">
        <div className="jobs-header">
          <h2>{showAllJobs ? 'All Jobs' : 'Matched Jobs'}</h2>
          <button 
            onClick={() => setShowAllJobs(!showAllJobs)}
            className="cyber-button"
          >
            {showAllJobs ? 'Show Matched Jobs' : 'Show All Jobs'}
          </button>
        </div>

        <div className="job-filters glass-morphism">
          <input 
            type="text"
            placeholder="Search jobs..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="cyber-input"
          />
          {/* Add more filters */}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p>Loading jobs...</p>
          </div>
        ) : (
          <>
            {showAllJobs ? (
              <div className="jobs-grid">
                {allJobs.map(job => (
                  <div 
                    key={job._id} 
                    className={`job-card glass-morphism ${
                      matchedJobs.find(mj => mj._id === job._id) ? 'matched-job' : ''
                    }`}
                  >
                    <h3>{job.title}</h3>
                    <p>{job.description}</p>
                    <div className="skills-list">
                      {job.requiredSkills.map(skill => (
                        <span 
                          key={skill} 
                          className={`skill-tag ${
                            userProfile.skills.includes(skill) ? 'matched-skill' : ''
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    {matchedJobs.find(mj => mj._id === job._id) && (
                      <div className="match-badge">Matched</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="jobs-grid">
                {matchedJobs.length > 0 ? (
                  matchedJobs.map(job => (
                    <div key={job._id} className="job-card glass-morphism matched-job">
                      <h3>{job.title}</h3>
                      <p>{job.description}</p>
                      <div className="skills-list">
                        {job.requiredSkills.map(skill => (
                          <span 
                            key={skill} 
                            className={`skill-tag ${
                              userProfile.skills.includes(skill) ? 'matched-skill' : ''
                            }`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-matches-message">
                    <p>No matched jobs found. Upload your resume or update your skills!</p>
                  </div>
                )}
              </div>
            )}
            
            {pagination && (
              <div className="pagination">
                <button
                  className="cyber-button"
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  className="cyber-button"
                  disabled={!pagination.hasMore}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Tests Section */}
      <section className="user-tests glass-morphism">
        <h2>Your Tests</h2>
        {testStats && (
          <div className="test-stats">
            <h3>Test Statistics</h3>
            <p>Total Tests: {testStats.totalTests}</p>
            <p>Passed Tests: {testStats.passedTests}</p>
            <p>Average Score: {testStats.averageScore.toFixed(2)}</p>
          </div>
        )}
        
        {userTests.length > 0 ? (
          <div className="tests-list">
            {userTests.map((test, index) => (
              <div key={index} className="test-item">
                <h4>{test.testId?.title || 'Unnamed Test'}</h4>
                <p>Job: {test.jobId?.title || 'No Job'}</p>
                <p>Status: {test.status}</p>
                <p>Score: {test.score}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No tests taken yet.</p>
        )}
      </section>

      <section className="resume-upload glass-morphism">
        <h2>Upload/Update Resume</h2>
        <ResumeUpload onUploadSuccess={() => {
          // Refresh matched jobs after resume upload
          getMatchedJobs().then(data => setMatchedJobs(data.jobs || []));
        }} />
      </section>
    </div>
  );
};

export default UserDashboard;
