const jwt = require('jsonwebtoken');
const { logger } = require('./logger');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        message: 'Not authorized to access this route'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user to request object
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      message: 'Not authorized to access this route'
    });
  }
};

// Restrict access based on role
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// Check if user is admin
exports.requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Only administrators can perform this action'
    });
  }
  next();
}; 