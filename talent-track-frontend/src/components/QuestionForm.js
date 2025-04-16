import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';

const QuestionForm = ({ 
  type, 
  initialData = null, 
  onSubmit, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    type,
    title: '',
    description: '',
    difficulty: 'medium',
    topic: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    testCases: [{ input: '', output: '', isPublic: true }],
    allowedLanguages: ['python', 'javascript', 'java']
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setFormData(prev => ({ ...prev, testCases: newTestCases }));
  };

  const addTestCase = () => {
    setFormData(prev => ({
      ...prev,
      testCases: [...prev.testCases, { input: '', output: '', isPublic: true }]
    }));
  };

  const removeTestCase = (index) => {
    setFormData(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      toast.success('Question saved successfully');
    } catch (error) {
      toast.error('Failed to save question');
      console.error('Error saving question:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Common Fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Difficulty</label>
          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Topic</label>
          <select
            name="topic"
            value={formData.topic}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select a topic</option>
            {type === 'aptitude' ? (
              <>
                <option value="quantitative">Quantitative</option>
                <option value="logical">Logical Reasoning</option>
                <option value="verbal">Verbal</option>
              </>
            ) : (
              <>
                <option value="arrays">Arrays</option>
                <option value="strings">Strings</option>
                <option value="graphs">Graphs</option>
                <option value="dp">Dynamic Programming</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Aptitude Question Fields */}
      {type === 'aptitude' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Options</h3>
          {formData.options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                required
                placeholder={`Option ${index + 1}`}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <input
                type="radio"
                name="correctAnswer"
                checked={formData.correctAnswer === index}
                onChange={() => setFormData(prev => ({ ...prev, correctAnswer: index }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      )}

      {/* Coding Question Fields */}
      {type === 'coding' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Allowed Languages</label>
            <div className="mt-2 space-x-4">
              {['python', 'javascript', 'java'].map(lang => (
                <label key={lang} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allowedLanguages.includes(lang)}
                    onChange={(e) => {
                      const newLanguages = e.target.checked
                        ? [...formData.allowedLanguages, lang]
                        : formData.allowedLanguages.filter(l => l !== lang);
                      setFormData(prev => ({ ...prev, allowedLanguages: newLanguages }));
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{lang}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Test Cases</h3>
              <button
                type="button"
                onClick={addTestCase}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <FaPlus className="mr-1" /> Add Test Case
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {formData.testCases.map((testCase, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Test Case {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeTestCase(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Input</label>
                      <textarea
                        value={testCase.input}
                        onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                        required
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Output</label>
                      <textarea
                        value={testCase.output}
                        onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                        required
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={testCase.isPublic}
                        onChange={(e) => handleTestCaseChange(index, 'isPublic', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Public Test Case</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {initialData ? 'Update Question' : 'Create Question'}
        </button>
      </div>
    </form>
  );
};

export default QuestionForm; 