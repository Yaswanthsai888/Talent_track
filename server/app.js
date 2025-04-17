const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const { logger } = require('./middleware/logger');
const { apiLimiter, examLimiter, codeExecutionLimiter } = require('./middleware/rateLimiter');
const { validateExamInput, validateQuestionInput, validateCodeSubmission } = require('./middleware/inputValidator');

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(cors({
  origin: true, // Allow all origins - will be restricted by the check below
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // Cache preflight requests for 24 hours
}));

// Custom origin validation
app.use((req, res, next) => {
  const allowedOrigins = ['https://pac-talent-track.web.app', 'http://localhost:3000'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  next();
});

app.use(helmet({
  crossOriginResourcePolicy: false, // Allow cross-origin resource sharing
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

// Body parsing middleware with increased limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting middleware
app.use('/api', apiLimiter);
app.use('/api/exams', examLimiter);
app.use('/api/code', codeExecutionLimiter);

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const adminRoutes = require('./routes/adminRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const examRoutes = require('./routes/examRoutes');
const questionRoutes = require('./routes/questionRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    headers: req.headers,
    query: req.query,
    body: req.body
  });
  next();
});

// 404 handler
app.use((req, res, next) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  if (err.name === 'MulterError') {
    return res.status(400).json({ 
      message: 'File upload error',
      error: err.message
    });
  }

  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error',
    path: req.path
  });
});

module.exports = app;