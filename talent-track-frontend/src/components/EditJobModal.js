import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import Button from './ui/button';

const EditJobModal = ({ show, job, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    employmentType: '',
    educationLevel: '',
    minExperience: '',
    overview: '',
    salaryRange: {
      min: '',
      max: '',
      currency: 'USD'
    },
    requiredSkills: [],
    responsibilities: [],
    benefits: []
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [responsibilityInput, setResponsibilityInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');

  useEffect(() => {
    if (job) {
      setFormData({
        ...job,
        salaryRange: {
          min: job.salaryRange?.min || '',
          max: job.salaryRange?.max || '',
          currency: job.salaryRange?.currency || 'USD'
        },
        requiredSkills: job.requiredSkills || [],
        responsibilities: job.responsibilities || [],
        benefits: job.benefits || []
      });
    }
  }, [job]);

  if (!show) return null;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.company) newErrors.company = 'Company is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.employmentType) newErrors.employmentType = 'Employment type is required';
    if (!formData.overview) newErrors.overview = 'Overview is required';
    if (!formData.salaryRange.min) newErrors.salaryMin = 'Minimum salary is required';
    if (!formData.salaryRange.max) newErrors.salaryMax = 'Maximum salary is required';
    if (formData.requiredSkills.length === 0) newErrors.skills = 'At least one skill is required';
    if (formData.responsibilities.length === 0) newErrors.responsibilities = 'At least one responsibility is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error updating job:', error);
      setErrors({ submit: 'Failed to update job. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('salary')) {
      const field = name.replace('salary', '').toLowerCase();
      setFormData(prev => ({
        ...prev,
        salaryRange: {
          ...prev.salaryRange,
          [field]: field === 'currency' ? value : Number(value)
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addListItem = (type, value, setter) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], value.trim()]
    }));
    setter('');
  };

  const removeListItem = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Edit Job Posting</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg ${errors.company ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg ${errors.employmentType ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
              {errors.employmentType && <p className="text-red-500 text-sm mt-1">{errors.employmentType}</p>}
            </div>
          </div>

          {/* Salary Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                name="salaryCurrency"
                value={formData.salaryRange.currency}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Salary</label>
              <input
                type="number"
                name="salaryMin"
                value={formData.salaryRange.min}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg ${errors.salaryMin ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.salaryMin && <p className="text-red-500 text-sm mt-1">{errors.salaryMin}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Salary</label>
              <input
                type="number"
                name="salaryMax"
                value={formData.salaryRange.max}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg ${errors.salaryMax ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.salaryMax && <p className="text-red-500 text-sm mt-1">{errors.salaryMax}</p>}
            </div>
          </div>

          {/* Overview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Overview</label>
            <textarea
              name="overview"
              value={formData.overview}
              onChange={handleInputChange}
              rows={4}
              className={`w-full p-2 border rounded-lg ${errors.overview ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.overview && <p className="text-red-500 text-sm mt-1">{errors.overview}</p>}
          </div>

          {/* Required Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg"
                placeholder="Enter a skill"
              />
              <Button
                type="button"
                onClick={() => addListItem('requiredSkills', skillInput, setSkillInput)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.requiredSkills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeListItem('requiredSkills', index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            {errors.skills && <p className="text-red-500 text-sm mt-1">{errors.skills}</p>}
          </div>

          {/* Responsibilities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={responsibilityInput}
                onChange={(e) => setResponsibilityInput(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg"
                placeholder="Enter a responsibility"
              />
              <Button
                type="button"
                onClick={() => addListItem('responsibilities', responsibilityInput, setResponsibilityInput)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Add
              </Button>
            </div>
            <ul className="list-disc list-inside space-y-2">
              {formData.responsibilities.map((responsibility, index) => (
                <li key={index} className="flex items-center justify-between">
                  <span>{responsibility}</span>
                  <button
                    type="button"
                    onClick={() => removeListItem('responsibilities', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            {errors.responsibilities && <p className="text-red-500 text-sm mt-1">{errors.responsibilities}</p>}
          </div>

          {/* Benefits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg"
                placeholder="Enter a benefit"
              />
              <Button
                type="button"
                onClick={() => addListItem('benefits', benefitInput, setBenefitInput)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Add
              </Button>
            </div>
            <ul className="list-disc list-inside space-y-2">
              {formData.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center justify-between">
                  <span>{benefit}</span>
                  <button
                    type="button"
                    onClick={() => removeListItem('benefits', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {errors.submit && (
            <p className="text-red-500 text-sm mt-4">{errors.submit}</p>
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditJobModal;