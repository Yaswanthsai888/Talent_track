import React from 'react';

const TestPreview = ({ test, onClose }) => {
  return (
    <div className="test-preview">
      <h2>Test Preview</h2>
      <p>Title: {test.title}</p>
      <p>Description: {test.description}</p>
      <p>Duration: {test.duration} minutes</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default TestPreview;