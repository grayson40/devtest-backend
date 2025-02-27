const express = require('express');
const { body, query } = require('express-validator');
const resultController = require('../controllers/resultController');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TestResult:
 *       type: object
 *       required:
 *         - testCase
 *         - environment
 *         - status
 *         - duration
 *         - metadata
 *       properties:
 *         testCase:
 *           type: string
 *           description: Reference to the test case
 *         sequence:
 *           type: string
 *           description: Reference to the test sequence (optional)
 *         environment:
 *           type: string
 *           description: Reference to the test environment
 *         status:
 *           type: string
 *           enum: [passed, failed, error, skipped]
 *         duration:
 *           type: number
 *           description: Test duration in milliseconds
 *         error:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             stack:
 *               type: string
 *         screenshots:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               step:
 *                 type: number
 *               path:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *         logs:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               level:
 *                 type: string
 *                 enum: [info, warn, error]
 *               message:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *         metadata:
 *           type: object
 *           required:
 *             - browser
 *           properties:
 *             browser:
 *               type: string
 *               enum: [chromium, firefox, webkit]
 *             viewport:
 *               type: object
 *               properties:
 *                 width:
 *                   type: number
 *                 height:
 *                   type: number
 *             userAgent:
 *               type: string
 */

/**
 * @swagger
 * /api/results:
 *   post:
 *     summary: Create a new test result
 *     tags: [Results]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TestResult'
 *     responses:
 *       201:
 *         description: Test result created successfully
 */
router.post(
  '/',
  [
    body('testCase').notEmpty().withMessage('Test case reference is required'),
    body('environment').notEmpty().withMessage('Environment reference is required'),
    body('status').isIn(['passed', 'failed', 'error', 'skipped']).withMessage('Invalid status'),
    body('duration').isNumeric().withMessage('Duration must be a number'),
    body('metadata.browser').isIn(['chromium', 'firefox', 'webkit']).withMessage('Invalid browser'),
    validate,
  ],
  resultController.createResult
);

/**
 * @swagger
 * /api/results:
 *   get:
 *     summary: Get all test results with filtering and pagination
 *     tags: [Results]
 *     parameters:
 *       - in: query
 *         name: testCase
 *         schema:
 *           type: string
 *       - in: query
 *         name: sequence
 *         schema:
 *           type: string
 *       - in: query
 *         name: environment
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [passed, failed, error, skipped]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of test results
 */
router.get(
  '/',
  [
    query('status').optional().isIn(['passed', 'failed', 'error', 'skipped']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  resultController.getAllResults
);

/**
 * @swagger
 * /api/results/{id}:
 *   get:
 *     summary: Get a test result by ID
 *     tags: [Results]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test result found
 *       404:
 *         description: Test result not found
 */
router.get('/:id', resultController.getResult);

/**
 * @swagger
 * /api/results/{id}:
 *   delete:
 *     summary: Delete a test result
 *     tags: [Results]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Test result deleted successfully
 */
router.delete('/:id', resultController.deleteResult);

module.exports = router; 