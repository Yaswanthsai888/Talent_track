import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '@/styles/components/TestComponents.css';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    type: 'aptitude',
    content: {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      testCases: []
    },
    difficultyLevel: 'medium',
    topic: '',
    maxScore: 10
  });

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    difficulty: '',
    topic: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/questions');
      setQuestions(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch questions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await axios.post('/api/questions', newQuestion);
      if (response.data.success) {
        fetchQuestions();
        setNewQuestion({
          type: 'aptitude',
          content: {
            question: '',
            options: ['', '', '', ''],
            correctAnswer: '',
            testCases: []
          },
          difficultyLevel: 'medium',
          topic: '',
          maxScore: 10
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add question');
    }
  };

  const filteredQuestions = questions.filter(question => (
    question.content.question.toLowerCase().includes(filters.search.toLowerCase()) &&
    (!filters.type || question.type === filters.type) &&
    (!filters.difficulty || question.difficultyLevel === filters.difficulty) &&
    (!filters.topic || question.topic === filters.topic)
  ));

  return (
    <div className="container">
      <h2>Question Bank</h2>
      {error && <div className="error-message">{error}</div>}
      {loading ? (
        <div>Loading questions...</div>
      ) : (
        <>
          <div className="filters">
            <input
              type="text"
              placeholder="Search questions..."
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
              className="search-input"
            />
            <select
              value={filters.type}
              onChange={e => setFilters({...filters, type: e.target.value})}
            >
              <option value="">All Types</option>
              <option value="aptitude">Aptitude</option>
              <option value="coding">Coding</option>
            </select>
            <select
              value={filters.difficulty}
              onChange={e => setFilters({...filters, difficulty: e.target.value})}
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="questions-grid">
            {filteredQuestions.map(question => (
              <div key={question._id} className="question-card">
                <h3>{question.content.question}</h3>
                <div className="question-meta">
                  <span className={`badge ${question.type}`}>{question.type}</span>
                  <span className={`badge ${question.difficultyLevel}`}>
                    {question.difficultyLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default QuestionBank;
