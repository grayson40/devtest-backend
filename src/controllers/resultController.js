const { TestResult } = require('../models');
const { APIError } = require('../middleware/errorHandler');

/**
 * Create a new test result
 */
exports.createResult = async (req, res, next) => {
  try {
    const result = await TestResult.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(new APIError(error.message, 400));
  }
};

/**
 * Get all test results with filtering and pagination
 */
exports.getAllResults = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object from query params
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.testCase) filter.testCase = req.query.testCase;
    if (req.query.environment) filter.environment = req.query.environment;

    const query = TestResult.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(['testCase', 'environment']);

    const [results, total] = await Promise.all([
      query,
      TestResult.countDocuments(filter),
    ]);

    res.status(200).json({
      status: 'success',
      results: total,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
      data: results,
    });
  } catch (error) {
    next(new APIError(error.message, 400));
  }
};

/**
 * Get test result by ID
 */
exports.getResult = async (req, res, next) => {
  try {
    const result = await TestResult.findById(req.params.id)
      .populate(['testCase', 'environment']);

    if (!result) {
      return next(new APIError('Test result not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(new APIError(error.message, 400));
  }
};

/**
 * Delete test result
 */
exports.deleteResult = async (req, res, next) => {
  try {
    const result = await TestResult.findById(req.params.id);

    if (!result) {
      return next(new APIError('Test result not found', 404));
    }

    await result.deleteOne();

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(new APIError(error.message, 400));
  }
}; 