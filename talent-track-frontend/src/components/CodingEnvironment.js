import React, { useState, useEffect } from 'react';
import { FaPlay, FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

const CodingEnvironment = ({ exam, onComplete }) => {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [testResults, setTestResults] = useState([]);
  const [timeLeft, setTimeLeft] = useState(exam.codingRound.timeLimit * 60);
  const [timerActive, setTimerActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let timer;
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [timeLeft, timerActive]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getLanguageExtension = () => {
    switch (language) {
      case 'javascript':
        return javascript();
      case 'python':
        return python();
      case 'java':
        return java();
      default:
        return javascript();
    }
  };

  const handleRunTests = async () => {
    try {
      const response = await axiosInstance.post(`/exams/jobs/${exam.jobId}/exam/coding/submit`, {
        problemId: exam.codingRound.problems[currentProblemIndex]._id,
        language,
        code
      });
      setTestResults(response.data.testResults);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error running tests');
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setTimerActive(false);

    try {
      const response = await axiosInstance.post(`/exams/jobs/${exam.jobId}/exam/coding/submit`, {
        problemId: exam.codingRound.problems[currentProblemIndex]._id,
        language,
        code
      });

      if (currentProblemIndex === exam.codingRound.problems.length - 1) {
        onComplete(response.data);
      } else {
        setCurrentProblemIndex(prev => prev + 1);
        setCode('');
        setTestResults([]);
        setTimerActive(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting solution');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentProblem = exam.codingRound.problems[currentProblemIndex];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2 text-red-600">
          <FaClock />
          <span className="font-semibold">{formatTime(timeLeft)}</span>
        </div>
        <div className="text-gray-600">
          Problem {currentProblemIndex + 1} of {exam.codingRound.problems.length}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Problem Description */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">{currentProblem.title}</h3>
          <div className="prose max-w-none">
            <p className="text-gray-700">{currentProblem.description}</p>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold mb-2">Test Cases</h4>
            <div className="space-y-4">
              {currentProblem.testCases.map((testCase, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Input</p>
                      <pre className="mt-1 bg-gray-100 p-2 rounded">{testCase.input}</pre>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Expected Output</p>
                      <pre className="mt-1 bg-gray-100 p-2 rounded">{testCase.expectedOutput}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Code Editor */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {exam.codingRound.allowedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
            <div className="flex space-x-2">
              <button
                onClick={handleRunTests}
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center space-x-2 hover:bg-blue-700"
              >
                <FaPlay />
                <span>Run Tests</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-4 py-2 bg-green-600 text-white rounded-md flex items-center space-x-2 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                }`}
              >
                <span>{currentProblemIndex === exam.codingRound.problems.length - 1 ? 'Submit' : 'Next Problem'}</span>
              </button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <CodeMirror
              value={code}
              height="500px"
              extensions={[getLanguageExtension()]}
              theme={vscodeDark}
              onChange={(value) => setCode(value)}
            />
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="font-semibold mb-4">Test Results</h4>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Test Case {index + 1}</span>
                      {result.passed ? (
                        <FaCheck className="text-green-600" />
                      ) : (
                        <FaTimes className="text-red-600" />
                      )}
                    </div>
                    {!result.passed && (
                      <div className="mt-2 text-sm">
                        <p className="text-gray-600">Expected: {result.expectedOutput}</p>
                        <p className="text-gray-600">Got: {result.actualOutput}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodingEnvironment; 