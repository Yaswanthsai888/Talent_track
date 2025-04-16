import React, { useState } from 'react';
import { FaCheck, FaTimes, FaEye, FaBriefcase, FaCalendar, FaCode } from 'react-icons/fa';
import axiosInstance from '../config/axios';
import { toast } from 'react-toastify';

const ApplicationFlowCard = ({ application, onUpdateStatus }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!application || !application.userId) {
    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 mb-4 shadow-lg backdrop-blur-sm">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { userId, status, coverLetter, appliedDate } = application;
  const { name = 'N/A', email = 'N/A', experience = 'Not specified', skills = [] } = userId || {};

  const statusColors = {
    pending: 'bg-yellow-500/30 border-yellow-500',
    reviewed: 'bg-blue-500/30 border-blue-500',
    accepted: 'bg-green-500/30 border-green-500',
    rejected: 'bg-red-500/30 border-red-500'
  };

  const statusActions = [
    {
      status: 'accepted',
      icon: FaCheck,
      label: 'Accept',
      color: 'text-green-400 hover:bg-green-400/30'
    },
    {
      status: 'rejected',
      icon: FaTimes,
      label: 'Reject',
      color: 'text-red-400 hover:bg-red-400/30'
    },
    {
      status: 'reviewed',
      icon: FaEye,
      label: 'Mark Reviewed',
      color: 'text-blue-400 hover:bg-blue-400/30'
    }
  ];

  const handleStatusUpdate = async (status) => {
    try {
      const response = await axiosInstance.put(
        `/jobs/${application.jobId}/applications/${application._id}/status`,
        { status }
      );
      
      if (response.data) {
        onUpdateStatus(application._id, response.data);
        toast.success('Application status updated successfully');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error(error.response?.data?.message || 'Failed to update application status');
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 mb-4 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm border border-gray-700/50">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="transition-transform hover:scale-102">
          <h4 className="text-xl font-bold text-white mb-1 tracking-wide">{name}</h4>
          <p className="text-sm text-gray-300 flex items-center gap-2">
            <span className="text-blue-400">@</span>{email}
          </p>
          <div className={`mt-3 inline-flex items-center px-4 py-1.5 rounded-full ${statusColors[status] || statusColors['pending']} border transition-all duration-300`}>
            <FaEye className="mr-2 text-white/80" />
            <span className="text-white capitalize font-medium">{status || 'pending'}</span>
          </div>
        </div>
        
        <div className="flex space-x-3">
          {statusActions.map((action) => (
            <button
              key={action.status}
              onClick={() => handleStatusUpdate(action.status)}
              className={`p-2.5 rounded-lg ${action.color} transition-all duration-300 hover:scale-110`}
              title={action.label}
            >
              <action.icon className="text-lg" />
            </button>
          ))}
        </div>
      </div>

      {/* Candidate Info */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-all duration-300">
          <h5 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
            <FaBriefcase className="mr-2 text-blue-400" />Experience
          </h5>
          <p className="text-white">{experience}</p>
        </div>
        <div className="bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-all duration-300">
          <h5 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
            <FaCalendar className="mr-2 text-blue-400" />Applied On
          </h5>
          <p className="text-white">
            {appliedDate ? new Date(appliedDate).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      {/* Skills */}
      <div className="mb-6">
        <h5 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
          <FaCode className="mr-2 text-blue-400" />Skills
        </h5>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span
              key={index}
              className="bg-blue-500/20 text-blue-200 text-xs px-3 py-1.5 rounded-full border border-blue-500/30 hover:bg-blue-500/30 transition-all duration-300 hover:scale-105"
            >
              {skill}
            </span>
          ))}
          {skills.length === 0 && (
            <span className="text-gray-400 text-sm italic">No skills listed</span>
          )}
        </div>
      </div>

      {/* Cover Letter */}
      <div 
        className={`bg-white/5 p-5 rounded-lg hover:bg-white/10 transition-all duration-300 cursor-pointer relative ${
          isExpanded ? 'h-auto' : 'h-[100px] overflow-hidden'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h5 className="text-sm font-medium text-gray-300 mb-3">Cover Letter</h5>
        <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">
          {coverLetter || 'No cover letter provided'}
        </p>
        {!isExpanded && coverLetter && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900/90 to-transparent" />
        )}
      </div>
    </div>
  );
};

export default ApplicationFlowCard;
