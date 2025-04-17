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
  const [hasExam, setHasExam] = useState(false);
  const [examStatus, setExamStatus] = useState(null);

  const checkApplicationStatus = useCallback(async () => {
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
  }, [job?._id, isAdmin]);

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
    checkApplicationStatus();
  }, [job?._id, isAdmin, checkApplicationStatus]);

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

  useEffect(() => {
    let retryCount = 0;
    let timeoutId;

    const fetchExamStatus = async () => {
      if (!job?._id || !hasApplied || !hasExam) return;
      
      try {
        const response = await axiosInstance.get(`/exams/jobs/${job._id}/exam/status`);
        setExamStatus(response.data.status);
        // Reset retry count on success
        retryCount = 0;
      } catch (error) {
        if (error.response?.status === 429) {
          // Rate limit hit - use exponential backoff
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 32000);
          retryCount++;
          timeoutId = setTimeout(fetchExamStatus, backoffTime);
        } else if (error.response?.status !== 404) {
          console.error('Error checking exam status:', error);
        }
      }
    };

    fetchExamStatus();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [job?._id, hasApplied, hasExam]);

  useEffect(() => {
    const checkExamAvailability = async () => {
      if (!job?._id || !hasApplied) return;
      
      try {
        const response = await axiosInstance.get(`/exams/jobs/${job._id}/exam`);
        if (response.data) {
          setHasExam(true);
          setExam(response.data);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          // This is expected if exam doesn't exist yet
          setHasExam(false);
          setExam(null);
        } else if (error.response?.status === 400) {
          // Application not accepted yet
          toast.warning(error.response.data.message);
          setHasExam(false);
          setExam(null);
        } else {
          console.error('Error checking exam availability:', error);
          toast.error('Failed to check exam availability');
        }
      }
    };

    checkExamAvailability();
  }, [job?._id, hasApplied]);

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

  const startExam = async () => {
    try {
      const response = await axiosInstance.post(`/exams/jobs/${job._id}/exam/start`);
      if (response.data) {
        // Redirect to exam page with job ID as query parameter
        navigate(`/exams?jobId=${job._id}`);
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to start exam');
      }
      console.error('Error starting exam:', error);
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
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 transition-all hover:shadow-xl relative max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 truncate">{job.title}</h3>
          <p className="text-base sm:text-lg text-gray-700 font-medium truncate">{job.company}</p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleEditClick}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1"
              type="button"
            >
              <FaEdit className="mr-1" /> Edit
            </Button>
            <Button
              onClick={() => onDelete && onDelete(job._id)}
              className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1"
              type="button"
            >
              <FaTrash className="mr-1" /> Delete
            </Button>
            <Button
              onClick={() => setShowExamModal(true)}
              className={`${exam ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white text-sm px-3 py-1`}
              type="button"
            >
              <FaFileAlt className="mr-1" /> {exam ? 'Edit Exam' : 'Create Exam'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <div className="flex items-center text-gray-700 text-sm">
          <FaMapMarkerAlt className="mr-2 text-blue-500 flex-shrink-0" />
          <span className="font-medium truncate">{job.location || 'Location not specified'}</span>
        </div>
        <div className="flex items-center text-gray-700 text-sm">
          <FaBriefcase className="mr-2 text-blue-500 flex-shrink-0" />
          <span className="font-medium truncate">{job.employmentType || 'Type not specified'}</span>
        </div>
        <div className="flex items-center text-gray-700 text-sm">
          <FaDollarSign className="mr-2 text-blue-500 flex-shrink-0" />
          <span className="font-medium truncate">
            {job.salaryRange ? formatSalary(job.salaryRange.min, job.salaryRange.max, job.salaryRange.currency) : 'Salary not specified'}
          </span>
        </div>
        <div className="flex items-center text-gray-700 text-sm">
          <FaGraduationCap className="mr-2 text-blue-500 flex-shrink-0" />
          <span className="font-medium truncate">{job.educationLevel || 'Not specified'}</span>
        </div>
        <div className="flex items-center text-gray-700 text-sm">
          <FaClock className="mr-2 text-blue-500 flex-shrink-0" />
          <span className="font-medium truncate">{job.minExperience ? `${job.minExperience} years experience` : 'Experience not specified'}</span>
        </div>
        {isAdmin && (
          <div className="flex items-center text-gray-700 text-sm">
            <FaUsers className="mr-2 text-blue-500 flex-shrink-0" />
            <span className="font-medium truncate">{applicationCount} applications</span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Job Overview</h4>
        <div className="relative">
          <p className={`text-gray-700 leading-relaxed text-sm sm:text-base ${expanded ? '' : 'max-h-24 overflow-hidden'}`}>
            {job.overview || 'No overview provided'}
          </p>
          {!expanded && job.overview && job.overview.length > 150 && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent"></div>
          )}
        </div>
        {job.overview && job.overview.length > 150 && (
          <button 
            onClick={toggleExpand}
            className="mt-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      <div className="mb-4">
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
                } px-2 py-1 rounded-full text-xs sm:text-sm font-medium truncate max-w-[200px]`}
              >
                {skill}
              </span>
            ))
          ) : (
            <span className="text-gray-500 text-sm">No skills specified</span>
          )}
        </div>
      </div>

      {hasApplied && applicationStatus && (
        <div className={`mb-4 p-3 rounded-lg ${getStatusColor()} text-center sm:text-left`}>
          <p className="text-sm font-medium">{getStatusMessage()}</p>
          {hasExam && applicationStatus === 'accepted' && (
            <div className="mt-2 flex flex-col sm:flex-row gap-2 justify-center sm:justify-start">
              {(!examStatus || examStatus === 'not_started') && (
                <Button
                  onClick={startExam}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2"
                  type="button"
                >
                  Take Assessment Test
                </Button>
              )}
              {examStatus === 'in_progress' && (
                <Button
                  onClick={() => navigate(`/exams?jobId=${job._id}`)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-4 py-2"
                  type="button"
                >
                  Continue Assessment Test
                </Button>
              )}
              {examStatus === 'completed' && (
                <p className="text-sm text-green-600 font-medium">Assessment Test Completed</p>
              )}
              {examStatus === 'failed' && (
                <p className="text-sm text-red-600 font-medium">Assessment Test Failed</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
        {!isAdmin ? (
          <>
            <Button
              onClick={() => setShowDetailsModal(true)}
              className="text-blue-600 hover:text-blue-800 text-sm"
              type="button"
            >
              View Details
            </Button>
            {!hasApplied && (
              <Button
                onClick={() => setShowModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2"
                type="button"
              >
                Apply Now
              </Button>
            )}
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleApplicationsClick}
              className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2"
              type="button"
            >
              View Applications
            </Button>
            <Button
              onClick={() => setShowDetailsModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2"
              type="button"
            >
              View Details
            </Button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-semibold mb-2 text-lg">Responsibilities:</h4>
          {job.responsibilities && job.responsibilities.length > 0 ? (
            <ul className="list-disc list-inside mb-4 space-y-2 text-sm sm:text-base">
              {job.responsibilities.map((resp, index) => (
                <li key={index} className="text-gray-700 pl-2">{resp}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 mb-4 text-sm">No responsibilities specified</p>
          )}

          <h4 className="font-semibold mb-2 text-lg">Benefits:</h4>
          {job.benefits && job.benefits.length > 0 ? (
            <ul className="list-disc list-inside space-y-2 text-sm sm:text-base">
              {job.benefits.map((benefit, index) => (
                <li key={index} className="text-gray-700 pl-2">{benefit}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No benefits specified</p>
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