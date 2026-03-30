import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '@/styles/components/TestComponents.css';
import TestPreview from './TestPreview';

const TestCreation = () => {
  const [formData, setFormData] = useState({
    jobId: '',
    testType: 'aptitude',
    title: '',
    description: '',
    difficultyLevel: 'medium',
    numberOfQuestions: 10,
    timeLimit: 60,
    schedule: {
      startDate: '',
      endDate: ''
    },
    questions: []
  });
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [advancedConfig, setAdvancedConfig] = useState({
    shuffleQuestions: false
  });
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validate form data
    if (!formData.title || !formData.jobId || !formData.questions.length) {
      setError('Please fill all required fields');
      return;
    }

    try {
      const response = await axios.post('/api/tests', {
        ...formData,
        questions: selectedQuestions.map(q => q._id),
        advancedConfig
      });
      
      if (response.data.success) {
        navigate('/admin/tests');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating test');
    }
  };

  return (
    <div className="container">
      <h2>Create New Test</h2>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="test-form">
        <label>
          Title:
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </label>
        <label>
          Description:
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </label>
        <label>
          Duration (minutes):
          <input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
          />
        </label>
        {/* Add more form fields as needed */}
        <button type="submit">Create Test</button>
      </form>

      <div className="advanced-config">
        <h3>Advanced Configuration</h3>
        <label>
          <input
            type="checkbox"
            checked={advancedConfig.shuffleQuestions}
            onChange={(e) => setAdvancedConfig({
              ...advancedConfig,
              shuffleQuestions: e.target.checked
            })}
          />
          Shuffle Questions
        </label>
      </div>

      {showPreview && (
        <TestPreview
          testData={formData}
          selectedQuestions={selectedQuestions}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default TestCreation;