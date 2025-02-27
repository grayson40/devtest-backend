const express = require('express');
const { body } = require('express-validator');
const sequenceController = require('../controllers/sequenceController');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TestSequence:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the test sequence
 *         description:
 *           type: string
 *           description: Description of the test sequence
 *         tests:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               testId:
 *                 type: string
 *                 description: ID of the test case
 *               order:
 *                 type: number
 *                 description: Order of execution
 *         environment:
 *           type: object
 *           description: Environment variables for the sequence
 *         status:
 *           type: string
 *           enum: [active, archived, running, completed, failed]
 *           description: Current status of the sequence
 */

/**
 * @swagger
 * /api/sequences:
 *   post:
 *     summary: Create a new test sequence
 *     tags: [Sequences]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TestSequence'
 *     responses:
 *       201:
 *         description: Test sequence created successfully
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('tests').optional().isArray(),
    body('tests.*.testId').optional().isMongoId(),
    body('tests.*.order').optional().isInt({ min: 0 }),
    validate,
  ],
  sequenceController.createSequence
);

/**
 * @swagger
 * /api/sequences:
 *   get:
 *     summary: Get all test sequences
 *     tags: [Sequences]
 *     responses:
 *       200:
 *         description: List of test sequences
 */
router.get('/', sequenceController.getAllSequences);

/**
 * @swagger
 * /api/sequences/{id}:
 *   get:
 *     summary: Get a test sequence by ID
 *     tags: [Sequences]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test sequence found
 *       404:
 *         description: Test sequence not found
 */
router.get('/:id', sequenceController.getSequence);

/**
 * @swagger
 * /api/sequences/{id}:
 *   patch:
 *     summary: Update a test sequence
 *     tags: [Sequences]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TestSequence'
 *     responses:
 *       200:
 *         description: Test sequence updated successfully
 */
router.patch(
  '/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('tests').optional().isArray(),
    body('tests.*.testId').optional().isMongoId(),
    body('tests.*.order').optional().isInt({ min: 0 }),
    validate,
  ],
  sequenceController.updateSequence
);

/**
 * @swagger
 * /api/sequences/{id}:
 *   delete:
 *     summary: Delete a test sequence
 *     tags: [Sequences]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Test sequence deleted successfully
 */
router.delete('/:id', sequenceController.deleteSequence);

module.exports = router; 