const winston = require('winston');
const { format } = winston;

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  next(err);
};

// Security logging middleware
const securityLogger = (req, res, next) => {
  // Log suspicious activities
  if (req.body && req.body.code) {
    logger.warn({
      type: 'code_submission',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });
  }
  
  // Log multiple exam attempts
  if (req.path.includes('/exam/start')) {
    logger.warn({
      type: 'exam_attempt',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  securityLogger
}; 