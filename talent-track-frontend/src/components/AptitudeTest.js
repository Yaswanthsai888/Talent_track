import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight, FaClock } from 'react-icons/fa';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';

const AptitudeTest = ({ exam, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(exam.aptitudeRound.timeLimit * 60);
  const [timerActive, setTimerActive] = useState(true);

  useEffect(() => {
    // Initialize answers array
    setAnswers(exam.aptitudeRound.questions.map(() => ({ selectedOption: null })));
  }, [exam]);

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

  const handleOptionSelect = (optionIndex) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = {
        ...newAnswers[currentQuestionIndex],
        selectedOption: optionIndex
      };
      return newAnswers;
    });
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < exam.aptitudeRound.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setTimerActive(false);
    try {
      const response = await axiosInstance.post(`/exams/jobs/${exam.jobId}/exam/aptitude/submit`, {
        answers: answers.map((answer, index) => ({
          questionId: exam.aptitudeRound.questions[index]._id,
          selectedOption: answer.selectedOption
        }))
      });
      onComplete(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting answers');
    }
  };

  const currentQuestion = exam.aptitudeRound.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2 text-red-600">
          <FaClock />
          <span className="font-semibold">{formatTime(timeLeft)}</span>
        </div>
        <div className="text-gray-600">
          Question {currentQuestionIndex + 1} of {exam.aptitudeRound.questions.length}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                currentAnswer?.selectedOption === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => handleOptionSelect(index)}
            >
              {option}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
            currentQuestionIndex === 0
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <FaArrowLeft />
          <span>Previous</span>
        </button>

        {currentQuestionIndex === exam.aptitudeRound.questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Submit Test
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center space-x-2 hover:bg-blue-700"
          >
            <span>Next</span>
            <FaArrowRight />
          </button>
        )}
      </div>

      {/* Question Navigation */}
      <div className="mt-6 grid grid-cols-5 gap-2">
        {exam.aptitudeRound.questions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentQuestionIndex(index)}
            className={`p-2 rounded-md ${
              index === currentQuestionIndex
                ? 'bg-blue-600 text-white'
                : answers[index]?.selectedOption !== null
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AptitudeTest; 