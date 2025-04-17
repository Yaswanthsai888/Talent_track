const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Exam routes limiter with more generous limits
const examLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 120, // 1 request per second on average
  message: 'Too many exam requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict limiter for code execution
const codeExecutionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Increased slightly to handle retries
  message: 'Too many code execution requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  examLimiter,
  codeExecutionLimiter
};