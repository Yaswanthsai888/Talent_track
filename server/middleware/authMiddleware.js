const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

exports.protect = async (req, res, next) => {
  try {
    console.log('Auth middleware headers:', {
      auth: req.headers.authorization,
      contentType: req.headers['content-type']
    });

    let token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No auth token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded);
    
    let user;
    if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id).select('-password');
    } else {
      user = await User.findById(decoded.id).select('-password');
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('User authenticated:', {
      userId: user._id,
      role: decoded.role,
      path: req.path
    });

    req.user = user;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

exports.requireAdmin = async (req, res, next) => {
  try {
    // First run the protect middleware to authenticate the user
    await exports.protect(req, res, () => {
      // Then check if the user is an admin
      if (req.userRole !== 'admin') {
        return res.status(403).json({ 
          message: 'Access denied. Admin privileges required.' 
        });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error in admin authentication', 
      error: error.message 
    });
  }
};

exports.requireAuth = async (req, res, next) => {
  try {
    // Run the protect middleware to authenticate the user
    await exports.protect(req, res, () => {
      // If protect middleware passes, the user is authenticated
      next();
    });
  } catch (error) {
    res.status(401).json({ 
      message: 'Authentication required', 
      error: error.message 
    });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ message: 'Not authorized for this action' });
    }
    next();
  };
};
