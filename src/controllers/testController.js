const { TestCase } = require('../models');
const { APIError } = require('../middleware/errorHandler');
const ScribeParser = require('../modules/parser/scribeParser');
const playwrightGenerator = require('../modules/generator/playwrightGenerator');
const logger = require('../utils/logger');

/**
 * Create a new test case from Scribe HTML
 */
exports.createTest = async (req, res, next) => {
  try {
    const { html } = req.body;
    if (!html) {
      throw new APIError('HTML content is required', 400);
    }

    // Parse the HTML content
    const parsedTest = ScribeParser.parse(html);
    const validation = ScribeParser.validate(parsedTest);

    if (!validation.isValid) {
      throw new APIError(`Invalid test case: ${validation.errors.join(', ')}`, 400);
    }

    // Transform steps to match expected format
    const formattedSteps = parsedTest.steps.map((step) => ({
      number: step.number,
      action: step.action,
      selector: step.selector || '',
      value: step.value || '',
      description: step.description,
    }));

    // Create test case
    const testCase = await TestCase.create({
      title: parsedTest.title,
      description: parsedTest.description || 'Generated from Scribe recording',
      steps: formattedSteps,
      status: 'draft',
    });

    // Generate Playwright test synchronously to ensure it's created
    try {
      const testPath = await playwrightGenerator.generateTest(testCase);
      logger.info('Successfully generated Playwright test', {
        testId: testCase._id,
        path: testPath,
      });
    } catch (genError) {
      logger.error('Failed to generate Playwright test', {
        testId: testCase._id,
        error: genError.message,
      });
    }

    res.status(201).json({
      status: 'success',
      data: testCase,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return next(new APIError(error.message, 400));
    }
    next(error);
  }
};

/**
 * Get all test cases
 */
exports.getAllTests = async (req, res, next) => {
  try {
    const tests = await TestCase.find().sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: tests.length,
      data: tests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single test case by ID
 */
exports.getTest = async (req, res, next) => {
  try {
    const test = await TestCase.findById(req.params.id);
    if (!test) {
      throw new APIError('Test case not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: test,
    });
  } catch (error) {
    // Convert invalid ObjectId errors
    if (error.name === 'CastError') {
      return next(new APIError('Invalid test case ID', 400));
    }
    next(error);
  }
};

/**
 * Update a test case
 */
exports.updateTest = async (req, res, next) => {
  try {
    const test = await TestCase.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!test) {
      throw new APIError('Test case not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: test,
    });
  } catch (error) {
    // Convert Mongoose validation errors
    if (error.name === 'ValidationError') {
      return next(new APIError(error.message, 400));
    }
    // Convert invalid ObjectId errors
    if (error.name === 'CastError') {
      return next(new APIError('Invalid test case ID', 400));
    }
    next(error);
  }
};

/**
 * Delete a test case
 */
exports.deleteTest = async (req, res, next) => {
  try {
    const test = await TestCase.findByIdAndDelete(req.params.id);
    if (!test) {
      throw new APIError('Test case not found', 404);
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    // Convert invalid ObjectId errors
    if (error.name === 'CastError') {
      return next(new APIError('Invalid test case ID', 400));
    }
    next(error);
  }
};
