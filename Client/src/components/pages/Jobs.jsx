import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get('/api/jobs', {
          headers: { 
            Authorization: `Bearer ${user?.token}` 
          }
        });
        setJobs(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch jobs');
        setLoading(false);
      }
    };

    if (user) {
      fetchJobs();
    }
  }, [user]);

  const handleApplyJob = async (jobId) => {
    try {
      await axios.post(`/api/jobs/${jobId}/apply`, {}, {
        headers: { 
          Authorization: `Bearer ${user?.token}` 
        }
      });
      alert('Application submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply for job');
    }
  };

  if (loading) {
    return <div className="loading">Loading jobs...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="jobs-page">
      <h1>Job Opportunities</h1>
      {jobs.length === 0 ? (
        <p>No jobs available at the moment.</p>
      ) : (
        <div className="job-list">
          {jobs.map((job) => (
            <div key={job._id} className="job-card">
              <h2>{job.title}</h2>
              <p className="company">{job.company}</p>
              <div className="job-details">
                <p className="location">{job.location}</p>
                <p className="salary">{job.salary}</p>
              </div>
              <div className="job-description">
                {job.description}
              </div>
              <div className="job-skills">
                <strong>Required Skills:</strong>
                <ul>
                  {job.requiredSkills.map((skill, index) => (
                    <li key={index}>{skill}</li>
                  ))}
                </ul>
              </div>
              {user && (
                <button 
                  onClick={() => handleApplyJob(job._id)}
                  className="apply-button"
                >
                  Apply Now
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Jobs;
