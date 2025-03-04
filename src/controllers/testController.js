const { TestCase } = require('../models');
const { APIError } = require('../middleware/errorHandler');
const ScribeParser = require('../modules/parser/scribeParser');
const playwrightGenerator = require('../modules/generator/playwrightGenerator');
const practiTestGenerator = require('../modules/generator/practiTestGenerator');
const logger = require('../utils/logger');
const fs = require('fs').promises;

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
      screenshotUrl: step.screenshotUrl || '',
    }));

    // Create test case
    const testCase = await TestCase.create({
      title: parsedTest.title,
      description: parsedTest.description || 'Generated from Scribe recording',
      steps: formattedSteps,
      status: 'draft',
    });

    // Generate files in parallel
    const [testPath, practiTestPath] = await Promise.allSettled([
      playwrightGenerator.generateTest(testCase),
      practiTestGenerator.generateExport(testCase)
    ]);

    // Update test case with file paths
    const updates = {};
    if (testPath.status === 'fulfilled') {
      updates.playwrightTestPath = testPath.value;
      logger.info('Successfully generated Playwright test', {
        testId: testCase._id,
        path: testPath.value
      });
    }

    if (practiTestPath.status === 'fulfilled') {
      updates.practiTestExportPath = practiTestPath.value;
      logger.info('Successfully generated PractiTest export', {
        testId: testCase._id,
        path: practiTestPath.value
      });
    }

    // Update test case with file paths if any were generated
    if (Object.keys(updates).length > 0) {
      await TestCase.findByIdAndUpdate(testCase._id, updates);
    }

    res.status(201).json({
      status: 'success',
      data: {
        ...testCase.toObject(),
        playwrightTestPath: testPath.status === 'fulfilled' ? testPath.value : null,
        practiTestExportPath: practiTestPath.status === 'fulfilled' ? practiTestPath.value : null
      },
    });
  } catch (error) {
    logger.error('Error in createTest', {
      error: error.stack
    });
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

    // Generate or regenerate the export
    const exportPath = await practiTestGenerator.generateExport(test);
    
    // Update test case with export path
    const updatedTest = await TestCase.findByIdAndUpdate(
      test._id, 
      { practiTestExportPath: exportPath },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        exportPath,
        downloadUrl: `/api/tests/${test._id}/download-export`,
        test: updatedTest
      }
    });
  } catch (error) {
    logger.error('Error exporting to PractiTest', {
      testId: req.params.id,
      error: error.message
    });
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
      // If no export exists, generate one on the fly
      try {
        const exportPath = await practiTestGenerator.generateExport(test);
        
        // Update test case with export path
        await TestCase.findByIdAndUpdate(test._id, {
          practiTestExportPath: exportPath
        });
        
        return res.download(exportPath);
      } catch (genError) {
        throw new APIError('Failed to generate PractiTest export', 500);
      }
    }

    // Check if file exists
    try {
      await fs.access(test.practiTestExportPath);
    } catch (error) {
      // If file doesn't exist, regenerate it
      try {
        const exportPath = await practiTestGenerator.generateExport(test);
        
        // Update test case with export path
        await TestCase.findByIdAndUpdate(test._id, {
          practiTestExportPath: exportPath
        });
        
        return res.download(exportPath);
      } catch (genError) {
        throw new APIError('Failed to regenerate PractiTest export', 500);
      }
    }

    res.download(test.practiTestExportPath);
  } catch (error) {
    logger.error('Error downloading PractiTest export', {
      testId: req.params.id,
      error: error.message
    });
    next(error);
  }
};

/**
 * Download Playwright test file
 */
exports.downloadPlaywrightTest = async (req, res, next) => {
  try {
    const test = await TestCase.findById(req.params.id);
    if (!test) {
      throw new APIError('Test case not found', 404);
    }

    if (!test.playwrightTestPath) {
      throw new APIError('No Playwright test found for this test case', 404);
    }

    // Check if file exists
    try {
      await fs.access(test.playwrightTestPath);
    } catch (error) {
      throw new APIError('Playwright test file not found on disk', 404);
    }

    res.download(test.playwrightTestPath);
  } catch (error) {
    next(error);
  }
};
