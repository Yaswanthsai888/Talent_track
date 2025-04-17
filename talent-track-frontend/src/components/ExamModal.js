import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import QuestionSelector from './QuestionSelector';

const ExamModal = ({ isOpen, onClose, onSubmit, examData, jobId }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    totalDuration: 60,
    passingCriteria: 70,
    aptitudeConfig: {
      enabled: true,
      duration: 30,
      passingScore: 60
    },
    codingConfig: {
      enabled: true,
      duration: 30,
      passingScore: 70
    }
  });

  const [selectedAptitudeQuestions, setSelectedAptitudeQuestions] = useState([]);
  const [selectedCodingQuestions, setSelectedCodingQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (examData) {
      setFormData({
        name: examData.name || '',
        description: examData.description || '',
        totalDuration: examData.totalDuration || 60,
        passingCriteria: examData.passingCriteria || 70,
        aptitudeConfig: examData.aptitudeConfig || {
          enabled: true,
          duration: 30,
          passingScore: 60
        },
        codingConfig: examData.codingConfig || {
          enabled: true,
          duration: 30,
          passingScore: 70
        }
      });
      setSelectedAptitudeQuestions(examData.questions?.filter(q => q.type === 'aptitude') || []);
      setSelectedCodingQuestions(examData.questions?.filter(q => q.type === 'coding') || []);
    }
  }, [examData]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleConfigChange = (configType, field, value) => {
    setFormData(prev => ({
      ...prev,
      [configType]: {
        ...prev[configType],
        [field]: typeof value === 'number' ? Number(value) : value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      if (!formData.name || !formData.totalDuration || !formData.passingCriteria) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate question selection based on config
      if (formData.aptitudeConfig.enabled && selectedAptitudeQuestions.length === 0) {
        toast.error('Please select at least one aptitude question');
        return;
      }

      if (formData.codingConfig.enabled && selectedCodingQuestions.length === 0) {
        toast.error('Please select at least one coding question');
        return;
      }

      // Prepare exam data
      const examPayload = {
        ...formData,
        jobId,
        questions: [
          ...selectedAptitudeQuestions.map(q => ({
            questionId: q._id,
            type: 'aptitude',
            version: q.version || 1
          })),
          ...selectedCodingQuestions.map(q => ({
            questionId: q._id,
            type: 'coding',
            version: q.version || 1
          }))
        ]
      };

      await onSubmit(examPayload);
      onClose();
    } catch (error) {
      console.error('Error saving exam:', error);
      toast.error(error.response?.data?.message || 'Failed to save exam');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {examData ? 'Edit Exam' : 'Create New Exam'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Total Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="totalDuration"
                  value={formData.totalDuration}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Passing Criteria (%) *
                </label>
                <input
                  type="number"
                  name="passingCriteria"
                  value={formData.passingCriteria}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  min="0"
                  max="100"
                  required
                />
              </div>
            </div>
          </div>

          {/* Aptitude Configuration */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Aptitude Round</h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.aptitudeConfig.enabled}
                  onChange={(e) => handleConfigChange('aptitudeConfig', 'enabled', e.target.checked)}
                  className="mr-2"
                />
                Enable
              </label>
            </div>

            {formData.aptitudeConfig.enabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.aptitudeConfig.duration}
                      onChange={(e) => handleConfigChange('aptitudeConfig', 'duration', e.target.value)}
                      className="w-full p-2 border rounded"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Passing Score (%)
                    </label>
                    <input
                      type="number"
                      value={formData.aptitudeConfig.passingScore}
                      onChange={(e) => handleConfigChange('aptitudeConfig', 'passingScore', e.target.value)}
                      className="w-full p-2 border rounded"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                <QuestionSelector
                  type="aptitude"
                  selectedQuestions={selectedAptitudeQuestions}
                  onSelect={setSelectedAptitudeQuestions}
                />
              </div>
            )}
          </div>

          {/* Coding Configuration */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Coding Round</h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.codingConfig.enabled}
                  onChange={(e) => handleConfigChange('codingConfig', 'enabled', e.target.checked)}
                  className="mr-2"
                />
                Enable
              </label>
            </div>

            {formData.codingConfig.enabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.codingConfig.duration}
                      onChange={(e) => handleConfigChange('codingConfig', 'duration', e.target.value)}
                      className="w-full p-2 border rounded"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Passing Score (%)
                    </label>
                    <input
                      type="number"
                      value={formData.codingConfig.passingScore}
                      onChange={(e) => handleConfigChange('codingConfig', 'passingScore', e.target.value)}
                      className="w-full p-2 border rounded"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                <QuestionSelector
                  type="coding"
                  selectedQuestions={selectedCodingQuestions}
                  onSelect={setSelectedCodingQuestions}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : examData ? 'Update Exam' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamModal;