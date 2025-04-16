import React, { useState, useEffect, useCallback } from 'react';
import { FaBriefcase, FaMapMarkerAlt, FaGraduationCap, FaDollarSign, FaUsers, FaEdit, FaTrash, FaClock, FaFileAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../config/axios';
import ApplicationModal from './ApplicationModal';
import Button from './ui/button';
import JobDetailsModal from './JobDetailsModal';
import EditJobModal from './EditJobModal';
import ExamModal from './ExamModal';
import { toast } from 'react-toastify';

const JobCard = ({
  job,
  isAdmin,
  onEdit,
  onDelete,
  onViewApplications,
  skillMatch = 0,
  userSkills = [],
  onSkillMatchCalculated
}) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applicationCount, setApplicationCount] = useState(0);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [exam, setExam] = useState(null);

  const calculateSkillMatch = useCallback(() => {
    if (!job?.requiredSkills || !userSkills || job?.requiredSkills.length === 0) {
      return 0;
    }

    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    const requiredSkillsLower = job.requiredSkills.map(s => s.toLowerCase());
    
    const matchedCount = requiredSkillsLower.filter(skill => 
      userSkillsLower.includes(skill)
    ).length;

    const matchPercentage = (matchedCount / requiredSkillsLower.length) * 100;
    if (onSkillMatchCalculated) {
      onSkillMatchCalculated(matchPercentage);
    }
    return matchPercentage;
  }, [job?.requiredSkills, userSkills, onSkillMatchCalculated]);

  useEffect(() => {
    const fetchApplicationCount = async () => {
      if (!job?._id || !isAdmin) return;
      
      try {
        const response = await axiosInstance.get(`/jobs/${job._id}/applications/count`);
        setApplicationCount(response.data?.count || 0);
      } catch (error) {
        console.error('Error fetching application count:', error);
        setApplicationCount(0);
      }
    };

    fetchApplicationCount();
  }, [job?._id, isAdmin]);

  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!job?._id || isAdmin) return;
      
      try {
        const response = await axiosInstance.get(`/jobs/${job._id}/application-status`);
        if (response.data) {
          setHasApplied(response.data.hasApplied);
          setApplicationStatus(response.data.applicationStatus);
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error('Error checking application status:', error);
        }
      }
    };

    checkApplicationStatus();
  }, [job?._id, isAdmin]);

  useEffect(() => {
    // Calculate skill match when component mounts or when job/userSkills change
    if (userSkills.length > 0 && job?.requiredSkills?.length > 0) {
      calculateSkillMatch();
    }
  }, [job?.requiredSkills, userSkills, calculateSkillMatch]);

  useEffect(() => {
    const fetchExam = async () => {
      if (!job?._id || !isAdmin) return;
      
      try {
        const response = await axiosInstance.get(`/exams/jobs/${job._id}/exam`);
        setExam(response.data);
      } catch (error) {
        if (error.response?.status === 404) {
          // Exam doesn't exist yet, which is fine
          setExam(null);
        } else {
          console.error('Error fetching exam:', error);
          toast.error('Failed to fetch exam details');
        }
      }
    };

    fetchExam();
  }, [job?._id, isAdmin]);

  if (!job || !job.title || !job.company) {
    return null;
  }

  const handleApply = async (coverLetter) => {
    setApplying(true);
    try {
      await axiosInstance.post(`/jobs/${job._id}/apply`, { coverLetter });
      setHasApplied(true);
      setApplicationStatus('pending');
      alert('Application submitted successfully!');
      setShowModal(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const handleApplicationsClick = () => {
    if (onViewApplications) {
      onViewApplications(job._id);
    }
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleEditSubmit = async (updatedJobData) => {
    try {
      await onEdit(updatedJobData);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Failed to update job. Please try again.');
    }
  };

  const handleCreateExam = async (examData) => {
    try {
      const response = await axiosInstance.post(`/exams/jobs/${job._id}/exam`, examData);
      setExam(response.data);
      setShowExamModal(false);
      toast.success('Exam created successfully');
    } catch (error) {
      toast.error('Failed to create exam');
      console.error('Error creating exam:', error);
    }
  };

  const handleEditExam = async (examData) => {
    try {
      const response = await axiosInstance.put(`/exams/jobs/${job._id}/exam`, examData);
      setExam(response.data);
      setShowExamModal(false);
      toast.success('Exam updated successfully');
    } catch (error) {
      toast.error('Failed to update exam');
      console.error('Error updating exam:', error);
    }
  };

  const formatSalary = (min, max, currency) => {
    if (!min || !max || !currency) {
      return 'Salary not specified';
    }
    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  };

  const getStatusColor = () => {
    switch(applicationStatus) {
      case 'accepted': return 'bg-green-500/20 text-green-800';
      case 'rejected': return 'bg-red-500/20 text-red-800';
      case 'reviewed': return 'bg-blue-500/20 text-blue-800';
      default: return 'bg-yellow-500/20 text-yellow-800';
    }
  };

  const getStatusMessage = () => {
    switch(applicationStatus) {
      case 'accepted': return 'Accepted - Congratulations!';
      case 'rejected': return 'Rejected - Better luck next time';
      case 'reviewed': return 'Under Review';
      case 'pending': return 'Pending Review';
      default: return 'Application Submitted';
    }
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 transition-all hover:shadow-xl hover:-translate-y-1 relative">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4">
        {!isAdmin && userSkills.length > 0 && job?.requiredSkills?.length > 0 && (
          <div className="absolute -top-3 -right-3 bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
            {Math.round(calculateSkillMatch())}% Match
          </div>
        )}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{job.title}</h3>
          <p className="text-lg text-gray-700 font-medium">{job.company}</p>
        </div>
        {isAdmin && (
          <div className="flex space-x-2">
            <Button
              onClick={handleEditClick}
              className="bg-blue-500 hover:bg-blue-600 text-white"
              type="button"
            >
              <FaEdit className="mr-2" /> Edit
            </Button>
            <Button
              onClick={() => onDelete && onDelete(job._id)}
              className="bg-red-500 hover:bg-red-600 text-white"
              type="button"
            >
              <FaTrash className="mr-2" /> Delete
            </Button>
            <Button
              onClick={() => setShowExamModal(true)}
              className={`${exam ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
              type="button"
            >
              <FaFileAlt className="mr-2" /> {exam ? 'Edit Exam' : 'Create Exam'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center text-gray-700">
          <FaMapMarkerAlt className="mr-2 text-blue-500" />
          <span className="font-medium">{job.location || 'Location not specified'}</span>
        </div>
        <div className="flex items-center text-gray-700">
          <FaBriefcase className="mr-2 text-blue-500" />
          <span className="font-medium">{job.employmentType || 'Type not specified'}</span>
        </div>
        <div className="flex items-center text-gray-700">
          <FaDollarSign className="mr-2 text-blue-500" />
          <span className="font-medium">
            {job.salaryRange ? formatSalary(job.salaryRange.min, job.salaryRange.max, job.salaryRange.currency) : 'Salary not specified'}
          </span>
        </div>
        <div className="flex items-center text-gray-700">
          <FaGraduationCap className="mr-2 text-blue-500" />
          <span className="font-medium">{job.educationLevel || 'Not specified'}</span>
        </div>
        <div className="flex items-center text-gray-700">
          <FaClock className="mr-2 text-blue-500" />
          <span className="font-medium">{job.minExperience ? `${job.minExperience} years experience` : 'Experience not specified'}</span>
        </div>
        {isAdmin && (
          <div className="flex items-center text-gray-700">
            <FaUsers className="mr-2 text-blue-500" />
            <span className="font-medium">{applicationCount} applications</span>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Job Overview</h4>
        <p className={`text-gray-700 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
          {job.overview || 'No overview provided'}
        </p>
        {job.overview && job.overview.length > 150 && (
          <button 
            onClick={toggleExpand}
            className="mt-2 text-blue-600 hover:text-blue-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse job description' : 'Expand job description'}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Required Skills</h4>
        <div className="flex flex-wrap gap-2">
          {job.requiredSkills && job.requiredSkills.length > 0 ? (
            job.requiredSkills.map((skill, index) => (
              <span
                key={index}
                className={`${
                  userSkills.includes(skill) || userSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase()) 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                } px-3 py-1.5 rounded-full text-sm font-medium`}
              >
                {skill}
              </span>
            ))
          ) : (
            <span className="text-gray-500">No skills specified</span>
          )}
        </div>
      </div>

      {hasApplied && applicationStatus && (
        <div className={`mb-4 p-2 rounded ${getStatusColor()}`}>
          <p className="text-sm font-medium">{getStatusMessage()}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        {!isAdmin && (
          <Button
            onClick={() => setShowDetailsModal(true)}
            className="text-blue-600 hover:text-blue-800"
            type="button"
          >
            View Details
          </Button>
        )}
        {!isAdmin && !hasApplied && (
          <Button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            type="button"
          >
            Apply Now
          </Button>
        )}
        {isAdmin && (
          <div className="flex space-x-2">
            <Button
              onClick={handleApplicationsClick}
              className="bg-green-500 hover:bg-green-600 text-white"
              type="button"
            >
              View Applications
            </Button>
            <Button
              onClick={() => setShowDetailsModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
              type="button"
            >
              View Details
            </Button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-semibold mb-2">Responsibilities:</h4>
          {job.responsibilities && job.responsibilities.length > 0 ? (
            <ul className="list-disc list-inside mb-4 space-y-2">
              {job.responsibilities.map((resp, index) => (
                <li key={index} className="text-gray-700 pl-2">{resp}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 mb-4">No responsibilities specified</p>
          )}

          <h4 className="font-semibold mb-2">Benefits:</h4>
          {job.benefits && job.benefits.length > 0 ? (
            <ul className="list-disc list-inside space-y-2">
              {job.benefits.map((benefit, index) => (
                <li key={index} className="text-gray-700 pl-2">{benefit}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No benefits specified</p>
          )}
        </div>
      )}

      {showModal && (
        <ApplicationModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleApply}
          applying={applying}
          job={job}
        />
      )}

      {showDetailsModal && (
        <JobDetailsModal
          show={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          job={job}
          applicationStatus={applicationStatus}
        />
      )}

      {showEditModal && (
        <EditJobModal
          show={showEditModal}
          job={job}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditSubmit}
        />
      )}

      {showExamModal && (
        <ExamModal
          isOpen={showExamModal}
          onClose={() => setShowExamModal(false)}
          jobId={job._id}
          examData={exam}
          onSubmit={exam ? handleEditExam : handleCreateExam}
        />
      )}
    </div>
  );
};

export default JobCard;