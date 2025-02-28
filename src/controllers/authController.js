const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { APIError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
};

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new APIError('Email already in use', 400);
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    logger.info('New user registered', { userId: user._id });
    createSendToken(user, 201, res);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      throw new APIError('Please provide email and password', 400);
    }

    // Check if user exists & password is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new APIError('Incorrect email or password', 401);
    }

    logger.info('User logged in', { userId: user._id });
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};
