import React from 'react';
import { FaBriefcase, FaMapMarkerAlt, FaGraduationCap, FaDollarSign, FaClock } from 'react-icons/fa';
import Button from './ui/button';

const JobDetailsModal = ({ show, job, applicationStatus, onClose }) => {
  if (!show) return null;

  const getStatusColor = () => {
    switch(applicationStatus) {
      case 'accepted': return 'bg-green-500/20 text-green-100 border-green-500';
      case 'rejected': return 'bg-red-500/20 text-red-100 border-red-500';
      case 'reviewed': return 'bg-blue-500/20 text-blue-100 border-blue-500';
      default: return 'bg-yellow-500/20 text-yellow-100 border-yellow-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900/90 rounded-xl w-full max-w-3xl p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{job.title}</h2>
            <p className="text-gray-300">{job.company}</p>
          </div>
          {applicationStatus && (
            <div className={`px-4 py-2 rounded-full border ${getStatusColor()}`}>
              <span className="capitalize">{applicationStatus}</span>
            </div>
          )}
        </div>

        {/* Basic Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center text-gray-300">
            <FaMapMarkerAlt className="mr-2 text-blue-400" />
            {job.location}
          </div>
          <div className="flex items-center text-gray-300">
            <FaGraduationCap className="mr-2 text-blue-400" />
            {job.educationLevel}
          </div>
          <div className="flex items-center text-gray-300">
            <FaBriefcase className="mr-2 text-blue-400" />
            {job.employmentType}
          </div>
          <div className="flex items-center text-gray-300">
            <FaDollarSign className="mr-2 text-blue-400" />
            {job.salaryRange.currency} {job.salaryRange.min.toLocaleString()} - {job.salaryRange.max.toLocaleString()}
          </div>
        </div>

        {/* Overview */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Overview</h3>
          <p className="text-gray-300">{job.overview}</p>
        </div>

        {/* Required Skills */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {job.requiredSkills.map((skill, index) => (
              <span
                key={index}
                className="bg-blue-500/20 text-blue-100 px-3 py-1 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Responsibilities */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Responsibilities</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            {job.responsibilities.map((resp, index) => (
              <li key={index}>{resp}</li>
            ))}
          </ul>
        </div>

        {/* Benefits */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Benefits</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            {job.benefits.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>
        </div>

        {/* Application Timeline */}
        {applicationStatus && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Application Timeline</h3>
            <div className="flex items-center text-sm text-gray-300">
              <FaClock className="mr-2 text-blue-400" />
              Application Status: <span className={`ml-2 capitalize font-medium ${getStatusColor()}`}>{applicationStatus}</span>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;
