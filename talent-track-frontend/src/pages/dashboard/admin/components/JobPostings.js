import React, { useState } from 'react';
import { FaSave, FaPlus, FaArrowLeft } from 'react-icons/fa';
import Button from '../../../../components/ui/button';
import axiosInstance from '../../../../config/axios';

const JobPostings = ({ onBack }) => {
  const [jobData, setJobData] = useState({
    // Job Title & Overview
    title: '',
    company: '',
    location: '',
    employmentType: 'Full-Time',
    
    // Job Description
    overview: '',
    responsibilities: [],
    
    // Qualifications & Requirements
    requiredSkills: [],
    educationLevel: 'Bachelor\'s',
    minExperience: 0,
    
    // Compensation
    salaryRange: {
      min: '',
      max: '',
      currency: 'USD'
    },
    benefits: [],
    
    // Application Process
    applicationDeadline: '',
    applicationInstructions: '',
    
    // Additional Fields
    department: '',
    industryType: ''
  });

  const [newResponsibility, setNewResponsibility] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested objects
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setJobData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setJobData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const addListItem = (listName, newItem, setNewItem) => {
    if (newItem.trim()) {
      setJobData(prev => ({
        ...prev,
        [listName]: [...prev[listName], newItem.trim()]
      }));
      setNewItem('');
    }
  };

  const removeListItem = (listName, indexToRemove) => {
    setJobData(prev => ({
      ...prev,
      [listName]: prev[listName].filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/jobs/create', jobData);
      alert('Job Posted Successfully!');
      onBack(); // Navigate back after successful posting
    } catch (error) {
      console.error('Job Posting Failed', error);
      alert('Failed to post job. Please try again.');
    } 
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="secondary"
          icon={FaArrowLeft}
          onClick={onBack}
          className="flex items-center"
        >
          Back to Dashboard
        </Button>
        <h2 className="text-2xl font-bold text-white">Create Job Posting</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Title & Overview Section */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold mb-4">Job Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Job Title</label>
              <input
                type="text"
                name="title"
                value={jobData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="e.g. Senior Software Engineer"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Company</label>
              <input
                type="text"
                name="company"
                value={jobData.company}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Company Name"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-gray-700 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={jobData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="City, Country"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Employment Type</label>
              <select
                name="employmentType"
                value={jobData.employmentType}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Department</label>
              <input
                type="text"
                name="department"
                value={jobData.department}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Engineering, Sales, etc."
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-gray-700 mb-2">Job Overview</label>
            <textarea
              name="overview"
              value={jobData.overview}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg"
              rows="4"
              placeholder="Provide a brief overview of the job..."
              required
            />
          </div>
        </div>

        {/* Responsibilities Section */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold mb-4">Responsibilities</h3>
          <div className="flex mb-4">
            <input
              type="text"
              value={newResponsibility}
              onChange={(e) => setNewResponsibility(e.target.value)}
              className="flex-grow px-4 py-2 border rounded-l-lg"
              placeholder="Add a job responsibility"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => addListItem('responsibilities', newResponsibility, setNewResponsibility)}
              className="rounded-r-lg"
            >
              <FaPlus className="mr-2" /> Add
            </Button>
          </div>

          {jobData.responsibilities.length > 0 && (
            <ul className="list-disc list-inside">
              {jobData.responsibilities.map((resp, index) => (
                <li key={index} className="flex justify-between items-center">
                  {resp}
                  <button
                    type="button"
                    onClick={() => removeListItem('responsibilities', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Qualifications Section */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold mb-4">Qualifications</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Required Skills</label>
              <div className="flex mb-4">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="flex-grow px-4 py-2 border rounded-l-lg"
                  placeholder="Add a required skill"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addListItem('requiredSkills', newSkill, setNewSkill)}
                  className="rounded-r-lg"
                >
                  <FaPlus className="mr-2" /> Add
                </Button>
              </div>

              {jobData.requiredSkills.length > 0 && (
                <ul className="list-disc list-inside">
                  {jobData.requiredSkills.map((skill, index) => (
                    <li key={index} className="flex justify-between items-center">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeListItem('requiredSkills', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Education Level</label>
              <select
                name="educationLevel"
                value={jobData.educationLevel}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="High School">High School</option>
                <option value="Associate's">Associate's</option>
                <option value="Bachelor's">Bachelor's</option>
                <option value="Master's">Master's</option>
                <option value="PhD">PhD</option>
              </select>

              <label className="block text-gray-700 mt-4 mb-2">Minimum Experience</label>
              <select
                name="minExperience"
                value={jobData.minExperience}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {[0, 1, 2, 3, 5, 7, 10].map(years => (
                  <option key={years} value={years}>
                    {years} {years === 1 ? 'year' : 'years'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Compensation Section */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold mb-4">Compensation</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Minimum Salary</label>
              <input
                type="number"
                name="salaryRange.min"
                value={jobData.salaryRange.min}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Minimum Salary"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Maximum Salary</label>
              <input
                type="number"
                name="salaryRange.max"
                value={jobData.salaryRange.max}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Maximum Salary"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Currency</label>
              <select
                name="salaryRange.currency"
                value={jobData.salaryRange.currency}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-gray-700 mb-2">Benefits</label>
            <div className="flex mb-4">
              <input
                type="text"
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                className="flex-grow px-4 py-2 border rounded-l-lg"
                placeholder="Add a job benefit"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => addListItem('benefits', newBenefit, setNewBenefit)}
                className="rounded-r-lg"
              >
                <FaPlus className="mr-2" /> Add
              </Button>
            </div>

            {jobData.benefits.length > 0 && (
              <ul className="list-disc list-inside">
                {jobData.benefits.map((benefit, index) => (
                  <li key={index} className="flex justify-between items-center">
                    {benefit}
                    <button
                      type="button"
                      onClick={() => removeListItem('benefits', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Application Process Section */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold mb-4">Application Process</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Application Deadline</label>
              <input
                type="date"
                name="applicationDeadline"
                value={jobData.applicationDeadline}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Application Instructions</label>
              <textarea
                name="applicationInstructions"
                value={jobData.applicationInstructions}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
                placeholder="Provide instructions for applying..."
                required
              />
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button
            type="submit" 
            variant="primary" 
            icon={FaSave}
            className="w-full md:w-auto"
          >
            Create Job Posting
          </Button>
        </div>
      </form>
    </div>
  );
};

export default JobPostings;