import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus } from 'react-icons/fa';
import axiosInstance from '../config/axios';
import { toast } from 'react-toastify';
import QuestionSelector from './QuestionSelector';
import QuestionForm from './QuestionForm';

const ExamModal = ({ isOpen, onClose, jobId, examData, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    totalDuration: 60,
    passingCriteria: 60,
    aptitudeConfig: {
      enabled: false,
      duration: 30,
      passingScore: 50
    },
    codingConfig: {
      enabled: false,
      duration: 30,
      passingScore: 50
    },
    aptitudeRound: {
      timeLimit: 30,
      totalQuestions: 10,
      passingScore: 50,
      negativeMarking: true,
      negativeMarks: 0.25,
      shuffleQuestions: true,
      questions: []
    },
    codingRound: {
      timeLimit: 60,
      totalProblems: 2,
      passingScore: 50,
      allowedLanguages: ['javascript', 'python', 'java'],
      problems: []
    }
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    marks: 1
  });

  const [currentProblem, setCurrentProblem] = useState({
    title: '',
    description: '',
    difficulty: 'easy',
    testCases: [],
    marks: 10
  });

  const [currentTestCase, setCurrentTestCase] = useState({
    input: '',
    expectedOutput: '',
    marks: 1
  });

  const [selectedAptitudeQuestions, setSelectedAptitudeQuestions] = useState([]);
  const [selectedCodingQuestions, setSelectedCodingQuestions] = useState([]);
  const [showAptitudeForm, setShowAptitudeForm] = useState(false);
  const [showCodingForm, setShowCodingForm] = useState(false);

  useEffect(() => {
    if (examData) {
      setFormData({
        name: examData.name,
        description: examData.description,
        totalDuration: examData.totalDuration,
        passingCriteria: examData.passingCriteria,
        aptitudeConfig: examData.aptitudeConfig,
        codingConfig: examData.codingConfig,
        aptitudeRound: examData.aptitudeRound,
        codingRound: examData.codingRound
      });
      // Load selected questions from examData
      if (examData.questions) {
        const aptitudeQuestions = examData.questions
          .filter(q => q.type === 'aptitude')
          .map(q => q.questionId);
        const codingQuestions = examData.questions
          .filter(q => q.type === 'coding')
          .map(q => q.questionId);
        setSelectedAptitudeQuestions(aptitudeQuestions);
        setSelectedCodingQuestions(codingQuestions);
      }
    }
  }, [examData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConfigChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [`${section}Config`]: {
        ...prev[`${section}Config`],
        [field]: value
      }
    }));
  };

  const handleAptitudeConfigChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      aptitudeRound: {
        ...prev.aptitudeRound,
        [name]: type === 'checkbox' ? e.target.checked : value
      }
    }));
  };

  const handleCodingConfigChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      codingRound: {
        ...prev.codingRound,
        [name]: value
      }
    }));
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const addQuestion = () => {
    if (!currentQuestion.question || currentQuestion.options.some(opt => !opt)) {
      toast.error('Please fill all question fields');
      return;
    }

    setFormData(prev => ({
      ...prev,
      aptitudeRound: {
        ...prev.aptitudeRound,
        questions: [...prev.aptitudeRound.questions, currentQuestion]
      }
    }));

    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      marks: 1
    });
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      aptitudeRound: {
        ...prev.aptitudeRound,
        questions: prev.aptitudeRound.questions.filter((_, i) => i !== index)
      }
    }));
  };

  const handleProblemChange = (e) => {
    const { name, value } = e.target;
    setCurrentProblem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTestCaseChange = (e) => {
    const { name, value } = e.target;
    setCurrentTestCase(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addTestCase = () => {
    if (!currentTestCase.input || !currentTestCase.expectedOutput) {
      toast.error('Please fill all test case fields');
      return;
    }

    setCurrentProblem(prev => ({
      ...prev,
      testCases: [...prev.testCases, currentTestCase]
    }));

    setCurrentTestCase({
      input: '',
      expectedOutput: '',
      marks: 1
    });
  };

  const removeTestCase = (index) => {
    setCurrentProblem(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index)
    }));
  };

  const addProblem = () => {
    if (!currentProblem.title || !currentProblem.description || currentProblem.testCases.length === 0) {
      toast.error('Please fill all problem fields and add at least one test case');
      return;
    }

    setFormData(prev => ({
      ...prev,
      codingRound: {
        ...prev.codingRound,
        problems: [...prev.codingRound.problems, currentProblem]
      }
    }));

    setCurrentProblem({
      title: '',
      description: '',
      difficulty: 'easy',
      testCases: [],
      marks: 10
    });
  };

  const removeProblem = (index) => {
    setFormData(prev => ({
      ...prev,
      codingRound: {
        ...prev.codingRound,
        problems: prev.codingRound.problems.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const examData = {
        ...formData,
        questions: [
          ...selectedAptitudeQuestions.map(q => ({
            questionId: q._id,
            version: q.version
          })),
          ...selectedCodingQuestions.map(q => ({
            questionId: q._id,
            version: q.version
          }))
        ]
      };

      await onSubmit(examData);
      onClose();
    } catch (error) {
      toast.error('Failed to save exam');
      console.error('Error saving exam:', error);
    }
  };

  const handleCreateQuestion = async (questionData) => {
    try {
      const response = await axiosInstance.post('/questions', questionData);
      if (questionData.type === 'aptitude') {
        setSelectedAptitudeQuestions(prev => [...prev, response.data]);
      } else {
        setSelectedCodingQuestions(prev => [...prev, response.data]);
      }
      setShowAptitudeForm(false);
      setShowCodingForm(false);
    } catch (error) {
      toast.error('Failed to create question');
      console.error('Error creating question:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {examData ? 'Edit Exam' : 'Create Exam'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Exam Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total Duration (minutes)
              </label>
              <input
                type="number"
                name="totalDuration"
                value={formData.totalDuration}
                onChange={handleInputChange}
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Passing Criteria (%)
              </label>
              <input
                type="number"
                name="passingCriteria"
                value={formData.passingCriteria}
                onChange={handleInputChange}
                required
                min="0"
                max="100"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Aptitude Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Aptitude Section</h3>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.aptitudeConfig.enabled}
                    onChange={(e) => handleConfigChange('aptitude', 'enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable Section</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAptitudeForm(true)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FaPlus className="mr-1" /> Create Question
                </button>
              </div>
            </div>

            {formData.aptitudeConfig.enabled && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Section Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.aptitudeConfig.duration}
                      onChange={(e) => handleConfigChange('aptitude', 'duration', e.target.value)}
                      required
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Passing Score (%)
                    </label>
                    <input
                      type="number"
                      value={formData.aptitudeConfig.passingScore}
                      onChange={(e) => handleConfigChange('aptitude', 'passingScore', e.target.value)}
                      required
                      min="0"
                      max="100"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <QuestionSelector
                  type="aptitude"
                  selectedQuestions={selectedAptitudeQuestions}
                  onQuestionsSelected={setSelectedAptitudeQuestions}
                  maxQuestions={10}
                />
              </>
            )}
          </div>

          {/* Coding Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Coding Section</h3>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.codingConfig.enabled}
                    onChange={(e) => handleConfigChange('coding', 'enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable Section</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCodingForm(true)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FaPlus className="mr-1" /> Create Question
                </button>
              </div>
            </div>

            {formData.codingConfig.enabled && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Section Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.codingConfig.duration}
                      onChange={(e) => handleConfigChange('coding', 'duration', e.target.value)}
                      required
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Passing Score (%)
                    </label>
                    <input
                      type="number"
                      value={formData.codingConfig.passingScore}
                      onChange={(e) => handleConfigChange('coding', 'passingScore', e.target.value)}
                      required
                      min="0"
                      max="100"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <QuestionSelector
                  type="coding"
                  selectedQuestions={selectedCodingQuestions}
                  onQuestionsSelected={setSelectedCodingQuestions}
                  maxQuestions={5}
                />
              </>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {examData ? 'Update Exam' : 'Create Exam'}
            </button>
          </div>
        </form>

        {/* Question Creation Modals */}
        {showAptitudeForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Create Aptitude Question</h3>
                <button
                  onClick={() => setShowAptitudeForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              <QuestionForm
                type="aptitude"
                onSubmit={handleCreateQuestion}
                onCancel={() => setShowAptitudeForm(false)}
              />
            </div>
          </div>
        )}

        {showCodingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Create Coding Question</h3>
                <button
                  onClick={() => setShowCodingForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              <QuestionForm
                type="coding"
                onSubmit={handleCreateQuestion}
                onCancel={() => setShowCodingForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamModal; 