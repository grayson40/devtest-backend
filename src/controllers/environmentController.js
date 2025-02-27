const Environment = require('../models/environment');
const { APIError } = require('../middleware/errorHandler');

/**
 * Create a new environment
 */
exports.createEnvironment = async (req, res, next) => {
  try {
    const environment = await Environment.create(req.body);

    res.status(201).json({
      status: 'success',
      data: environment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new APIError('Environment with this name already exists', 400));
    }
    if (error.name === 'ValidationError') {
      return next(new APIError(error.message, 400));
    }
    next(error);
  }
};

/**
 * Get all environments
 */
exports.getAllEnvironments = async (req, res, next) => {
  try {
    const environments = await Environment.find().sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: environments.length,
      data: environments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get environment by ID
 */
exports.getEnvironment = async (req, res, next) => {
  try {
    const environment = await Environment.findById(req.params.id);

    if (!environment) {
      throw new APIError('Environment not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: environment,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return next(new APIError('Invalid environment ID', 400));
    }
    next(error);
  }
};

/**
 * Update environment
 */
exports.updateEnvironment = async (req, res, next) => {
  try {
    const environment = await Environment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!environment) {
      throw new APIError('Environment not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: environment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new APIError('Environment with this name already exists', 400));
    }
    if (error.name === 'ValidationError') {
      return next(new APIError(error.message, 400));
    }
    if (error.name === 'CastError') {
      return next(new APIError('Invalid environment ID', 400));
    }
    next(error);
  }
};

/**
 * Delete environment
 */
exports.deleteEnvironment = async (req, res, next) => {
  try {
    const environment = await Environment.findById(req.params.id);

    if (!environment) {
      throw new APIError('Environment not found', 404);
    }

    // Check if environment is in use
    // TODO: Add check for environment usage in test sequences

    await environment.deleteOne();

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return next(new APIError('Invalid environment ID', 400));
    }
    next(error);
  }
};
