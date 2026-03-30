const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['aptitude', 'coding'],
    required: true
  },
  content: {
    question: String,
    options: [String], // For aptitude MCQs
    correctAnswer: String, // For aptitude
    testCases: [{ // For coding
      input: String,
      expectedOutput: String
    }]
  },
  difficultyLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  maxScore: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Question', questionSchema);
