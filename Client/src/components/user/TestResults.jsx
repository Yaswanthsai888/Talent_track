import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../../styles/TestComponents.css';

const TestResults = () => {
  const { testId } = useParams();
  const [results, setResults] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get(`/api/attempts/${testId}`);
        setResults(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchResults();
  }, [testId]);

  if (!results) return <div>Loading results...</div>;

  return (
    <div className="container">
      <h2>Test Results</h2>
      <div className="results-summary">
        <div className="result-card">
          <h3>Time Taken</h3>
          <p>{Math.floor(results.timeTaken)} minutes</p>
        </div>
        <div className="result-card">
          <h3>Status</h3>
          <p className={`status ${results.status}`}>{results.status}</p>
        </div>
        <div className="result-card">
          <h3>Questions Attempted</h3>
          <p>{results.answers.length} / {results.testId.numberOfQuestions}</p>
        </div>
      </div>
      <div className="answers-review">
        {results.answers.map((answer, index) => (
          <div key={index} className="answer-item">
            <h4>Question {index + 1}</h4>
            <p>Your Answer: {answer.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestResults;
