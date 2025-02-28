const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/user');
const { APIError } = require('./errorHandler');
const logger = require('../utils/logger');

exports.protect = async (req, res, next) => {
  try {
    // Get token from header
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new APIError('Please log in to access this resource', 401);
    }

    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new APIError('User no longer exists', 401);
    }

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid token attempt', { error: error.message });
      return next(new APIError('Invalid token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      logger.warn('Expired token attempt');
      return next(new APIError('Token expired', 401));
    }
    next(error);
  }
};
