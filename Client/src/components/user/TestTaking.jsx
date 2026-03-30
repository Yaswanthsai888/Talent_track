import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '@/styles/components/TestComponents.css';

const TestTaking = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [progressSaved, setProgressSaved] = useState(true);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  const fetchTest = async () => {
    try {
      const res = await axios.get(`/api/tests/${testId}`);
      setTest(res.data.data);
      setTimeLeft(res.data.data.timeLimit * 60);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      handleSubmit();
    }
  }, [timeLeft]);

  useEffect(() => {
    let saveTimer;
    if (answers && !progressSaved) {
      saveTimer = setTimeout(saveProgress, 30000);
    }
    return () => clearTimeout(saveTimer);
  }, [answers, progressSaved]);

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    setProgressSaved(false);
  };

  const handleQuestionChange = (index) => {
    setCurrentQuestion(index);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    try {
      await axios.post(`/api/tests/${testId}/submit`, { answers });
      navigate('/tests/results', { state: { submitted: true } });
    } catch (err) {
      console.error('Error submitting test:', err);
      alert('Failed to submit test. Please try again.');
    }
  };

  if (!test) return <div>Loading...</div>;

  return (
    <div className="test-container">
      <div className="timer">Time Left: {formatTime(timeLeft)}</div>
      <div className="save-status">
        {!progressSaved && <span className="saving">Saving...</span>}
        {progressSaved && <span className="saved">All changes saved</span>}
      </div>
      
      {test.questions && (
        <div className="question-container">
          <div className="question-navigation">
            {test.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => handleQuestionChange(index)}
                className={`nav-button ${currentQuestion === index ? 'active' : ''} 
                           ${answers[index] ? 'answered' : ''}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          <div className="current-question">
            {test.questions[currentQuestion] && (
              <>
                <h3>Question {currentQuestion + 1}</h3>
                <p>{test.questions[currentQuestion].content.question}</p>
                <div className="answer-options">
                  {test.questions[currentQuestion].content.options.map((option, idx) => (
                    <label key={idx}>
                      <input
                        type="radio"
                        name={`question-${currentQuestion}`}
                        value={option}
                        checked={answers[currentQuestion] === option}
                        onChange={(e) => handleAnswer(currentQuestion, e.target.value)}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestTaking;
