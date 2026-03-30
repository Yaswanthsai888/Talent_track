import React, { useState } from 'react';
import axios from 'axios';
import { read, utils } from 'xlsx';

const BulkQuestionUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const workbook = read(e.target.result, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = utils.sheet_to_json(firstSheet);
      setPreview(data);
    };

    if (file) {
      setFile(file);
      reader.readAsArrayBuffer(file);
    }
  };

  const handleImport = async () => {
    try {
      await axios.post('/api/questions/import', { questions: preview });
      alert('Questions imported successfully!');
    } catch (err) {
      console.error(err);
      alert('Error importing questions');
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        type: 'aptitude',
        question: 'Example question',
        options: 'Option1,Option2,Option3,Option4',
        correctAnswer: 'Option1',
        difficultyLevel: 'medium',
        topic: 'General',
        maxScore: 10
      }
    ];
    const ws = utils.json_to_sheet(template);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Template');
    // Download template
  };

  return (
    <div className="bulk-upload">
      <h3>Bulk Question Upload</h3>
      
      <div className="upload-section">
        <button onClick={downloadTemplate}>
          Download Template
        </button>
        
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
        />
      </div>

      {preview.length > 0 && (
        <div className="preview-section">
          <h4>Preview ({preview.length} questions)</h4>
          <div className="preview-list">
            {preview.slice(0, 5).map((question, index) => (
              <div key={index} className="preview-item">
                <p>Question: {question.question}</p>
                <p>Type: {question.type}</p>
              </div>
            ))}
          </div>
          <button onClick={handleImport}>
            Import Questions
          </button>
        </div>
      )}
    </div>
  );
};

export default BulkQuestionUpload;
