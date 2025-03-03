const { TestCase } = require('../models');
const { APIError } = require('../middleware/errorHandler');
const ScribeParser = require('../modules/parser/scribeParser');
const playwrightGenerator = require('../modules/generator/playwrightGenerator');
const practiTestGenerator = require('../modules/generator/practiTestGenerator');
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

    // Generate Playwright test
    let testPath;
    try {
      testPath = await playwrightGenerator.generateTest(testCase);
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

    // Generate PractiTest export
    let practiTestPath;
    try {
      practiTestPath = await practiTestGenerator.generateExport(testCase);
      logger.info('Successfully generated PractiTest export', {
        testId: testCase._id,
        path: practiTestPath,
      });
      
      // Update test case with PractiTest export path
      await TestCase.findByIdAndUpdate(testCase._id, {
        practiTestExportPath: practiTestPath
      });
    } catch (exportError) {
      logger.error('Failed to generate PractiTest export', {
        testId: testCase._id,
        error: exportError.message,
      });
    }

    res.status(201).json({
      status: 'success',
      data: {
        ...testCase.toObject(),
        playwrightTestPath: testPath,
        practiTestExportPath: practiTestPath
      },
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

/**
 * Export a test case to PractiTest format
 */
exports.exportToPractiTest = async (req, res, next) => {
  try {
    const test = await TestCase.findById(req.params.id);
    if (!test) {
      throw new APIError('Test case not found', 404);
    }

    const exportPath = await practiTestGenerator.generateExport(test);
    
    // Update test case with export path
    await TestCase.findByIdAndUpdate(test._id, {
      practiTestExportPath: exportPath
    });

    res.status(200).json({
      status: 'success',
      data: {
        exportPath,
        downloadUrl: `/api/tests/${test._id}/download-export`
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download PractiTest export file
 */
exports.downloadPractiTestExport = async (req, res, next) => {
  try {
    const test = await TestCase.findById(req.params.id);
    if (!test) {
      throw new APIError('Test case not found', 404);
    }

    if (!test.practiTestExportPath) {
      throw new APIError('No PractiTest export found for this test case', 404);
    }

    res.download(test.practiTestExportPath);
  } catch (error) {
    next(error);
  }
};
