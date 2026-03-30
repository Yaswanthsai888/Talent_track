const CustomError = require('../utils/CustomError');

module.exports = (req, res, next) => {
  if (req.user.role !== 'admin') {
    throw new CustomError('Access denied. Admin privileges required.', 403);
  }
  next();
};
