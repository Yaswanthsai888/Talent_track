const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');

// Import security middlewares
const { apiLimiter, examLimiter, codeExecutionLimiter } = require('./middleware/rateLimiter');
const { validateExamInput, validateQuestionInput, validateCodeSubmission } = require('./middleware/inputValidator');
const { requestLogger, errorLogger, securityLogger } = require('./middleware/logger');

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet()); // Adds various HTTP headers for security
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10kb' })); // Limit JSON body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging middleware
app.use(requestLogger);
app.use(errorLogger);
app.use(securityLogger);

// Rate limiting middleware
app.use('/api', apiLimiter); // General API rate limit
app.use('/api/exams', examLimiter); // Stricter limit for exam routes
app.use('/api/code', codeExecutionLimiter); // Very strict limit for code execution

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const adminRoutes = require('./routes/adminRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const examRoutes = require('./routes/examRoutes');
const questionRoutes = require('./routes/questionRoutes');

// Use routes with validation
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use(errorLogger);
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message 
  });
});

module.exports = app;