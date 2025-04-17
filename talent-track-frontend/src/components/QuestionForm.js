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
    type: type === 'aptitude' ? 'Multiple Choice' : 'Coding',
    content: '',
    difficulty: 'Easy',
    category: '',
    points: 1,
    options: type === 'aptitude' ? [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ] : [],
    testCases: type === 'coding' ? [{ input: '', expectedOutput: '', isPublic: true }] : [],
    allowedLanguages: type === 'coding' ? ['python', 'javascript', 'java'] : []
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

  const handleOptionChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : field === 'isCorrect' ? { ...opt, isCorrect: false } : opt
      )
    }));
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setFormData(prev => ({ ...prev, testCases: newTestCases }));
  };

  const addTestCase = () => {
    setFormData(prev => ({
      ...prev,
      testCases: [...prev.testCases, { input: '', expectedOutput: '', isPublic: true }]
    }));
  };

  const removeTestCase = (index) => {
    setFormData(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.content.trim()) {
      toast.error('Question content is required');
      return false;
    }

    if (type === 'aptitude') {
      if (formData.options.some(opt => !opt.text.trim())) {
        toast.error('All options must be filled out');
        return false;
      }
      if (!formData.options.some(opt => opt.isCorrect)) {
        toast.error('Please mark one option as correct');
        return false;
      }
    } else {
      if (formData.testCases.length === 0) {
        toast.error('Add at least one test case');
        return false;
      }
      if (formData.testCases.some(tc => !tc.input.trim() || !tc.expectedOutput.trim())) {
        toast.error('All test case fields must be filled out');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      toast.error('Failed to save question');
      console.error('Error saving question:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Common Fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Question Content</label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleInputChange}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter your question here..."
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
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select a category</option>
            {type === 'aptitude' ? (
              <>
                <option value="Numerical Reasoning">Numerical Reasoning</option>
                <option value="Logical Reasoning">Logical Reasoning</option>
                <option value="Verbal Ability">Verbal Ability</option>
              </>
            ) : (
              <>
                <option value="Arrays">Arrays</option>
                <option value="Strings">Strings</option>
                <option value="Dynamic Programming">Dynamic Programming</option>
                <option value="Algorithms">Algorithms</option>
              </>
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Points</label>
          <input
            type="number"
            name="points"
            value={formData.points}
            onChange={handleInputChange}
            required
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Aptitude Question Fields */}
      {type === 'aptitude' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Options</h3>
          {formData.options.map((option, index) => (
            <div key={index} className="flex items-center gap-4">
              <input
                type="text"
                value={option.text}
                onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                required
                placeholder={`Option ${index + 1}`}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={option.isCorrect}
                  onChange={() => handleOptionChange(index, 'isCorrect', true)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Correct Answer</span>
              </label>
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
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Input</label>
                        <textarea
                          value={testCase.input}
                          onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                          rows={2}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Expected Output</label>
                        <textarea
                          value={testCase.expectedOutput}
                          onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                          rows={2}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTestCase(index)}
                      className="ml-4 text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
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