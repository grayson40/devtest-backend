const { TestSequence, TestCase } = require('../models');
const { APIError } = require('../middleware/errorHandler');

/**
 * Create a new test sequence
 */
exports.createSequence = async (req, res, next) => {
  try {
    const { name, description, tests, environment } = req.body;

    // Validate test IDs exist
    if (tests && tests.length > 0) {
      const testIds = tests.map(test => test.testId);
      const existingTests = await TestCase.find({ _id: { $in: testIds } });
      
      if (existingTests.length !== testIds.length) {
        throw new APIError('One or more test cases do not exist', 400);
      }
    }

    const sequence = await TestSequence.create({
      name,
      description,
      tests,
      environment,
      status: 'active',
    });

    res.status(201).json({
      status: 'success',
      data: sequence,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return next(new APIError(error.message, 400));
    }
    next(error);
  }
};

/**
 * Get all test sequences
 */
exports.getAllSequences = async (req, res, next) => {
  try {
    const sequences = await TestSequence.find()
      .populate('tests.testId', 'title description status')
      .sort('-createdAt');
    
    res.status(200).json({
      status: 'success',
      results: sequences.length,
      data: sequences,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single test sequence
 */
exports.getSequence = async (req, res, next) => {
  try {
    const sequence = await TestSequence.findById(req.params.id)
      .populate('tests.testId', 'title description status');

    if (!sequence) {
      throw new APIError('Test sequence not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: sequence,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return next(new APIError('Invalid sequence ID', 400));
    }
    next(error);
  }
};

/**
 * Update a test sequence
 */
exports.updateSequence = async (req, res, next) => {
  try {
    // If updating tests, validate they exist
    if (req.body.tests && req.body.tests.length > 0) {
      const testIds = req.body.tests.map(test => test.testId);
      const existingTests = await TestCase.find({ _id: { $in: testIds } });
      
      if (existingTests.length !== testIds.length) {
        throw new APIError('One or more test cases do not exist', 400);
      }
    }

    const sequence = await TestSequence.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate('tests.testId', 'title description status');

    if (!sequence) {
      throw new APIError('Test sequence not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: sequence,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return next(new APIError(error.message, 400));
    }
    if (error.name === 'CastError') {
      return next(new APIError('Invalid sequence ID', 400));
    }
    next(error);
  }
};

/**
 * Delete a test sequence
 */
exports.deleteSequence = async (req, res, next) => {
  try {
    const sequence = await TestSequence.findByIdAndDelete(req.params.id);
    
    if (!sequence) {
      throw new APIError('Test sequence not found', 404);
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return next(new APIError('Invalid sequence ID', 400));
    }
    next(error);
  }
}; 