import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaChartBar } from 'react-icons/fa';

const ExamResults = ({ exam, attempt }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pass':
        return 'text-green-600';
      case 'fail':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass':
        return <FaCheckCircle className="text-green-600" />;
      case 'fail':
        return <FaTimesCircle className="text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Exam Results</h2>
          <div className={`flex items-center space-x-2 ${getStatusColor(attempt.result)}`}>
            {getStatusIcon(attempt.result)}
            <span className="text-lg font-semibold">
              {attempt.result === 'pass' ? 'Passed' : 'Failed'}
            </span>
          </div>
        </div>

        {/* Overall Score */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Overall Score</h3>
            <span className="text-2xl font-bold">{attempt.finalScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full ${
                attempt.result === 'pass' ? 'bg-green-600' : 'bg-red-600'
              }`}
              style={{ width: `${attempt.finalScore}%` }}
            ></div>
          </div>
        </div>

        {/* Aptitude Round Results */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Aptitude Round</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Score</p>
              <p className="text-xl font-semibold">{attempt.aptitudeAttempt.totalScore}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-xl font-semibold">
                {attempt.aptitudeAttempt.status === 'completed' ? 'Completed' : 'Incomplete'}
              </p>
            </div>
          </div>

          {/* Question-wise Results */}
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Question-wise Results</h4>
            <div className="space-y-2">
              {attempt.aptitudeAttempt.answers.map((answer, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    answer.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Question {index + 1}</span>
                    <span className={answer.isCorrect ? 'text-green-600' : 'text-red-600'}>
                      {answer.marksObtained} marks
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coding Round Results */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Coding Round</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Score</p>
              <p className="text-xl font-semibold">{attempt.codingAttempt.totalScore}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-xl font-semibold">
                {attempt.codingAttempt.status === 'completed' ? 'Completed' : 'Incomplete'}
              </p>
            </div>
          </div>

          {/* Problem-wise Results */}
          <div className="space-y-4">
            {attempt.codingAttempt.problems.map((problem, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">Problem {index + 1}</h4>
                  <span className="text-lg font-semibold">{problem.totalScore}%</span>
                </div>

                {/* Test Case Results */}
                <div className="space-y-2">
                  {problem.testResults.map((result, tcIndex) => (
                    <div
                      key={tcIndex}
                      className={`border rounded-lg p-3 ${
                        result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Test Case {tcIndex + 1}</span>
                        {result.passed ? (
                          <span className="text-green-600">Passed</span>
                        ) : (
                          <span className="text-red-600">Failed</span>
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamResults; 