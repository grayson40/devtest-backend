const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const {
  createTest,
  getAllTests,
  getTest,
  updateTest,
  deleteTest,
  exportToPractiTest,
  downloadPractiTestExport,
} = require('../controllers/testController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TestCase:
 *       type: object
 *       required:
 *         - title
 *         - steps
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the test case
 *         description:
 *           type: string
 *           description: Optional description of the test case
 *         steps:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - number
 *               - description
 *               - action
 *             properties:
 *               number:
 *                 type: number
 *                 description: Step number in sequence
 *               description:
 *                 type: string
 *                 description: Description of the step
 *               action:
 *                 type: string
 *                 enum: [click, fill, goto, wait, assert, unknown, view]
 *                 description: Type of action to perform
 *               selector:
 *                 type: string
 *                 description: Element selector for the action
 *               value:
 *                 type: string
 *                 description: Value to use in the action
 *               screenshotUrl:
 *                 type: string
 *                 description: URL of the step's screenshot
 *         status:
 *           type: string
 *           enum: [draft, active, archived]
 *           default: draft
 *           description: Current status of the test case
 */

// Validation rules
const createTestValidation = [
  body('html').notEmpty().withMessage('HTML content is required'),
  validate,
];

const updateTestValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('steps').optional().isArray().withMessage('Steps must be an array'),
  body('steps.*.number')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Step number must be a positive integer'),
  body('steps.*.description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Step description is required'),
  body('steps.*.action')
    .optional()
    .isIn(['goto', 'click', 'fill', 'upload', 'wait', 'assert', 'view', 'unknown'])
    .withMessage('Invalid action type'),
  validate,
];

/**
 * @swagger
 * /api/tests:
 *   post:
 *     summary: Create a new test case from Scribe HTML
 *     tags: [Tests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - html
 *             properties:
 *               html:
 *                 type: string
 *                 description: Scribe HTML content
 *     responses:
 *       201:
 *         description: Test case created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/TestCase'
 *       400:
 *         description: Invalid request
 *   get:
 *     summary: Get all test cases
 *     tags: [Tests]
 *     responses:
 *       200:
 *         description: List of test cases
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: number
 *                   description: Number of test cases
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TestCase'
 */
router.route('/').post(createTestValidation, createTest).get(getAllTests);

/**
 * @swagger
 * /api/tests/{id}:
 *   get:
 *     summary: Get a test case by ID
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Test case ID
 *     responses:
 *       200:
 *         description: Test case found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/TestCase'
 *       404:
 *         description: Test case not found
 *   patch:
 *     summary: Update a test case
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Test case ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TestCase'
 *     responses:
 *       200:
 *         description: Test case updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/TestCase'
 *       404:
 *         description: Test case not found
 *   delete:
 *     summary: Delete a test case
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Test case ID
 *     responses:
 *       204:
 *         description: Test case deleted
 *       404:
 *         description: Test case not found
 */
router.route('/:id').get(getTest).patch(updateTestValidation, updateTest).delete(deleteTest);

/**
 * @swagger
 * /api/tests/{id}/export-practitest:
 *   post:
 *     tags: [Tests]
 *     summary: Export test to PractiTest format
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test exported successfully
 */
router.post('/:id/export-practitest', exportToPractiTest);

/**
 * @swagger
 * /api/tests/{id}/download-export:
 *   get:
 *     tags: [Tests]
 *     summary: Download PractiTest export file
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/download-export', downloadPractiTestExport);

module.exports = router;
