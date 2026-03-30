import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllUsers, 
  logout, 
  getAdminJobs, 
  createJob, 
  updateJob, 
  deleteJob, 
  createJobTest, 
  getJobTests,
  getJobTestResults 
} from '../services/api';

const JobManagementDashboard = () => {
  const formatUserSkills = (skills) => {
    return skills && skills.length > 0 ? skills.join(', ') : 'No skills';
  };
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    location: '',
    salary: { min: '', max: '' }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [testForm, setTestForm] = useState({
    title: '',
    description: '',
    type: 'aptitude', // default type
    difficulty: 'medium',
    passCriteria: {
      minScore: 60,
      maxAttempts: 3
    }
  });
  const [selectedJobForTest, setSelectedJobForTest] = useState(null);
  const [jobTests, setJobTests] = useState([]);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const jobsData = await getAdminJobs();
        
        // Check if jobsData is an array
        const jobs = Array.isArray(jobsData) ? jobsData : [];
        
        setJobs(jobs);
        setError(jobs.length === 0 ? 'No job postings found' : null);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError(error.message || 'Failed to fetch job postings');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const formattedJob = {
            title: jobForm.title,
            description: jobForm.description,
            requiredSkills: jobForm.requiredSkills.split(',').map(skill => skill.trim()),
            location: {
                city: jobForm.location,
                country: 'Not Specified',
                isRemote: true
            },
            salary: {
                min: Number(jobForm.salary.min) || 0,
                max: Number(jobForm.salary.max) || 0,
                currency: 'USD'
            },
            employmentType: 'full-time'
        };

        const newJob = await createJob(formattedJob);
        if (newJob.success) {
            setJobs([...jobs, newJob.data]);
            setJobForm({
                title: '',
                description: '',
                requiredSkills: '',
                location: '',
                salary: { min: '', max: '' }
            });
        } else {
            throw new Error(newJob.error || 'Failed to create job');
        }
    } catch (error) {
        console.error('Failed to create job', error);
        setError(error.message || 'Failed to create job');
    } finally {
        setIsSubmitting(false);
    }
};

  const handleEditJob = (job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title,
      description: job.description,
      requiredSkills: job.requiredSkills.join(', '),
      location: job.location || '',
      salary: job.salary || { min: '', max: '' }
    });
    setIsEditing(true);
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formattedJob = {
        ...jobForm,
        requiredSkills: jobForm.requiredSkills.split(',').map(skill => skill.trim())
      };
      const updatedJob = await updateJob(editingJob._id, formattedJob);
      setJobs(jobs.map(job => job._id === updatedJob._id ? updatedJob : job));
      setIsEditing(false);
      setEditingJob(null);
      setJobForm({
        title: '',
        description: '',
        requiredSkills: '',
        location: '',
        salary: { min: '', max: '' }
      });
    } catch (error) {
      console.error('Failed to update job', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await deleteJob(jobId);
      setJobs(jobs.filter(job => job._id !== jobId));
    } catch (error) {
      console.error('Failed to delete job', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      const updatedJob = await updateJob(jobId, { status: newStatus });
      setJobs(jobs.map(job => job._id === updatedJob._id ? updatedJob : job));
    } catch (error) {
      console.error('Failed to update job status', error);
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    if (!selectedJobForTest) {
      alert('Please select a job to create a test for');
      return;
    }

    try {
      const newTest = await createJobTest(selectedJobForTest._id, {
        ...testForm,
        jobId: selectedJobForTest._id
      });
      
      // Refresh job tests
      const updatedTests = await getJobTests(selectedJobForTest._id);
      setJobTests(updatedTests);

      // Reset form
      setTestForm({
        title: '',
        description: '',
        type: 'aptitude',
        difficulty: 'medium',
        passCriteria: {
          minScore: 60,
          maxAttempts: 3
        }
      });
      setSelectedJobForTest(null);
    } catch (error) {
      console.error('Failed to create test', error);
      alert('Failed to create test: ' + error.message);
    }
  };

  const handleViewJobTests = async (job) => {
    try {
      const tests = await getJobTests(job._id);
      setJobTests(tests);
      setSelectedJobForTest(job);
    } catch (error) {
      console.error('Failed to fetch job tests', error);
    }
  };

  const handleViewTestResults = async (job) => {
    try {
      const results = await getJobTestResults(job._id);
      setTestResults(results);
      setSelectedJobForTest(job);
    } catch (error) {
      console.error('Failed to fetch test results', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <header>
        <h1>Job Management Dashboard</h1>
        <div className="header-actions">
          <button 
            onClick={handleLogout} 
            className="logout-btn cyber-button" 
            title="Logout from the system"
          >
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div className="error-message glass-morphism">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="cyber-button">
            Retry
          </button>
        </div>
      )}

      {/* Job Posting Form */}
      <section className="job-posting glass-morphism">
        <h2>{isEditing ? 'Update Job Posting' : 'Create Job Posting'}</h2>
        <form onSubmit={isEditing ? handleUpdateJob : handleJobSubmit} className="cyber-form">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={jobForm.title}
              onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
              required
              className="cyber-input"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={jobForm.description}
              onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
              required
              className="cyber-input"
            />
          </div>
          <div className="form-group">
            <label>Required Skills (comma-separated)</label>
            <input
              type="text"
              value={jobForm.requiredSkills}
              onChange={(e) => setJobForm({...jobForm, requiredSkills: e.target.value})}
              required
              className="cyber-input"
            />
          </div>
          <div className="form-actions">
            <button 
              type="submit" 
              className={`cyber-button ${isSubmitting ? 'loading' : ''}`} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : isEditing ? 'Update Job' : 'Create Job'}
            </button>
            {isEditing && (
              <button 
                type="button" 
                onClick={() => {
                  setIsEditing(false);
                  setEditingJob(null);
                  setJobForm({
                    title: '',
                    description: '',
                    requiredSkills: '',
                    location: '',
                    salary: { min: '', max: '' }
                  });
                }}
                className="cyber-button cancel"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Job Listings */}
      <section className="job-listings">
        <h2>Your Job Postings</h2>
        {loading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p>Loading jobs...</p>
          </div>
        ) : (
          <>
            <div className="jobs-grid">
              {jobs.map(job => (
                <div key={job._id} className="job-card glass-morphism">
                  <h3>{job.title}</h3>
                  <p>{job.description}</p>
                  <div className="skills-list">
                    {job.requiredSkills.map(skill => (
                      <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                  <select
                    value={job.status}
                    onChange={(e) => handleStatusChange(job._id, e.target.value)}
                    className="cyber-input"
                  >
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                  <div className="job-actions">
                    <button 
                      onClick={() => handleEditJob(job)}
                      className="cyber-button edit"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteJob(job._id)}
                      className="cyber-button delete"
                    >
                      Delete
                    </button>
                    <button 
                      onClick={() => handleViewJobTests(job)}
                      className="cyber-button view-tests"
                    >
                      View Tests
                    </button>
                    <button 
                      onClick={() => handleViewTestResults(job)}
                      className="cyber-button view-results"
                    >
                      View Results
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
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

      {/* Test Creation Form */}
      {selectedJobForTest && (
        <section className="test-creation glass-morphism">
          <h2>Create Test for {selectedJobForTest.title}</h2>
          <form onSubmit={handleCreateTest} className="cyber-form">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={testForm.title}
                onChange={(e) => setTestForm({...testForm, title: e.target.value})}
                required
                className="cyber-input"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={testForm.description}
                onChange={(e) => setTestForm({...testForm, description: e.target.value})}
                required
                className="cyber-input"
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select
                value={testForm.type}
                onChange={(e) => setTestForm({...testForm, type: e.target.value})}
                required
                className="cyber-input"
              >
                <option value="aptitude">Aptitude</option>
                <option value="technical">Technical</option>
              </select>
            </div>
            <div className="form-group">
              <label>Difficulty</label>
              <select
                value={testForm.difficulty}
                onChange={(e) => setTestForm({...testForm, difficulty: e.target.value})}
                required
                className="cyber-input"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="form-group">
              <label>Pass Criteria</label>
              <div className="pass-criteria">
                <div className="form-group">
                  <label>Min Score</label>
                  <input
                    type="number"
                    value={testForm.passCriteria.minScore}
                    onChange={(e) => setTestForm({
                      ...testForm,
                      passCriteria: {
                        ...testForm.passCriteria,
                        minScore: e.target.value
                      }
                    })}
                    required
                    className="cyber-input"
                  />
                </div>
                <div className="form-group">
                  <label>Max Attempts</label>
                  <input
                    type="number"
                    value={testForm.passCriteria.maxAttempts}
                    onChange={(e) => setTestForm({
                      ...testForm,
                      passCriteria: {
                        ...testForm.passCriteria,
                        maxAttempts: e.target.value
                      }
                    })}
                    required
                    className="cyber-input"
                  />
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button 
                type="submit" 
                className="cyber-button"
              >
                Create Test
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Job Tests */}
      {jobTests.length > 0 && (
        <section className="job-tests glass-morphism">
          <h2>Tests for {selectedJobForTest.title}</h2>
          <ul>
            {jobTests.map(test => (
              <li key={test._id}>{test.title}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <section className="test-results glass-morphism">
          <h2>Results for {selectedJobForTest.title}</h2>
          <table className="test-results-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Test Name</th>
                <th>Score</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {testResults.map(result => (
                <tr key={result._id}>
                  <td>{result.userId?.name || 'Unknown Candidate'}</td>
                  <td>{result.testId?.title || 'Unnamed Test'}</td>
                  <td>{result.score}%</td>
                  <td className={result.isPassed ? 'pass' : 'fail'}>
                    {result.isPassed ? 'Passed' : 'Failed'}
                  </td>
                  <td>{new Date(result.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Existing user management section */}
      <section className="user-management">
        <h2>User Management</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Skills</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  {formatUserSkills(user.skills)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default JobManagementDashboard;
