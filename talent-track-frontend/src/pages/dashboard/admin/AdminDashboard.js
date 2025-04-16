import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import axiosInstance from '../../../config/axios';
import DashboardLayout from '../../../components/DashboardLayout';
import JobPostings from './components/JobPostings';
import JobCard from '../../../components/JobCard';
import ApplicationsList from '../../../components/ApplicationsList';
import Button from '../../../components/ui/button';

const AdminDashboard = () => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState({ applications: [], stats: {} });
  const [totalApplicationsCount, setTotalApplicationsCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axiosInstance.get('/admin/me'); // Update admin profile request URL
        setAdminData(response.data);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axiosInstance.get('/jobs/admin');
        setJobs(response.data.jobPostings);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    const fetchJobApplications = async (jobId) => {
      try {
        const response = await axiosInstance.get(`/jobs/${jobId}/applications`);
        setApplications(response.data);
      } catch (error) {
        console.error('Error fetching applications:', error);
      }
    };

    if (selectedJob) {
      fetchJobApplications(selectedJob);
    }
  }, [selectedJob]);

  useEffect(() => {
    const fetchTotalApplications = async () => {
      try {
        let totalCount = 0;
        
        for (const job of jobs) {
          const response = await axiosInstance.get(`/jobs/${job._id}/applications/count`);
          totalCount += response.data.count || 0;
        }
        
        setTotalApplicationsCount(totalCount);
      } catch (error) {
        console.error('Error fetching total applications:', error);
      }
    };

    if (jobs.length > 0) {
      fetchTotalApplications();
    }
  }, [jobs]);

  const handleEditJob = (jobId) => {
    // Implement edit functionality
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await axiosInstance.delete(`/jobs/${jobId}`);
      setJobs(jobs.filter(job => job._id !== jobId));
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const handleViewApplications = (jobId) => {
    setSelectedJob(jobId);
    const fetchJobApplications = async () => {
      try {
        const response = await axiosInstance.get(`/jobs/${jobId}/applications`);
        setApplications(response.data); // This now contains { applications: [], stats: {} }
      } catch (error) {
        console.error('Error fetching applications:', error);
        setApplications({ applications: [], stats: {} }); // Set default value on error
      }
    };
    fetchJobApplications();
  };

  const handleUpdateApplicationStatus = async (applicationId, status) => {
    try {
      const response = await axiosInstance.put(
        `/jobs/${selectedJob}/applications/${applicationId}/status`, 
        { status }
      );
      
      // Update applications state with new data
      setApplications({
        applications: response.data.applications,
        stats: response.data.stats
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status');
    }
  };

  const handleBulkAccept = async (minSkillMatch) => {
    try {
      const response = await axiosInstance.put(`/jobs/${selectedJob}/bulk-update-status`, {
        minSkillMatch,
        status: 'accepted'
      });
      
      // Update the applications state with the new data
      setApplications({
        applications: response.data.applications,
        stats: response.data.stats
      });
      
      alert(`Successfully updated ${response.data.applications.length} applications`);
    } catch (error) {
      console.error('Error performing bulk accept:', error);
      alert('Failed to perform bulk accept');
    }
  };

  const renderContent = () => {
    if (activeSection === 'jobPostings') {
      return <JobPostings onBack={() => setActiveSection('dashboard')} />;
    }

    if (selectedJob) {
      // Find the selected job details
      const selectedJobDetails = jobs.find(job => job._id === selectedJob);
      
      return (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="secondary" 
              onClick={() => setSelectedJob(null)}
              className="mr-4"
            >
              Back to Jobs
            </Button>
            <div className="text-white">
              <h2 className="text-xl font-bold">{selectedJobDetails?.title}</h2>
              <p className="text-sm opacity-75">{selectedJobDetails?.company}</p>
            </div>
          </div>
          
          <ApplicationsList 
            applications={applications.applications}
            stats={applications.stats}
            onUpdateStatus={handleUpdateApplicationStatus}
            onBulkAccept={handleBulkAccept}
          />
        </div>
      );
    }

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              Welcome, {adminData?.name}
              {adminData?.companyName && ` (${adminData.companyName})`}!
            </h2>
            <Button 
              variant="primary"
              icon={FaPlus}
              onClick={() => setActiveSection('jobPostings')}
            >
              Post New Job
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Active Jobs</h3>
              <p className="text-3xl font-bold text-purple-600">
                {adminData?.activeJobPostingsCount || 0}
              </p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Total Applications</h3>
              <p className="text-3xl font-bold text-blue-600">
                {totalApplicationsCount}
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Application Rate</h3>
              <p className="text-3xl font-bold text-green-600">
                {adminData?.activeJobPostingsCount ? 
                  `${(totalApplicationsCount / adminData.activeJobPostingsCount).toFixed(1)}/job` : 
                  '0/job'}
              </p>
            </div>
          </div>
        </div>

        {/* Job Listings */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">Your Job Postings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map(job => (
              <JobCard
                key={job._id}
                job={job}
                isAdmin={true}
                onEdit={handleEditJob}
                onDelete={handleDeleteJob}
                onViewApplications={() => handleViewApplications(job._id)}
                applicationsCount={
                  applications.applications.filter(app => app.jobId === job._id).length
                }
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading || !adminData) {
    return <DashboardLayout loading={true} isAdmin={true} />;
  }

  return (
    <DashboardLayout isAdmin>
      {renderContent()}
    </DashboardLayout>
  );
};

export default AdminDashboard;
