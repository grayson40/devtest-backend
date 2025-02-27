const express = require('express');
const { body } = require('express-validator');
const environmentController = require('../controllers/environmentController');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Environment:
 *       type: object
 *       required:
 *         - name
 *         - baseUrl
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the environment
 *         baseUrl:
 *           type: string
 *           description: Base URL for the environment
 *         variables:
 *           type: object
 *           description: Environment variables
 *         browser:
 *           type: string
 *           enum: [chromium, firefox, webkit]
 *           default: chromium
 *         description:
 *           type: string
 *           description: Environment description
 *         status:
 *           type: string
 *           enum: [active, archived]
 *           default: active
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         auth:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [none, basic, bearer, custom]
 *             username:
 *               type: string
 *             password:
 *               type: string
 *             token:
 *               type: string
 *         headers:
 *           type: object
 *           description: Custom HTTP headers
 */

/**
 * @swagger
 * /api/environments:
 *   post:
 *     summary: Create a new environment
 *     tags: [Environments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Environment'
 *     responses:
 *       201:
 *         description: Environment created successfully
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('baseUrl').trim().notEmpty().withMessage('Base URL is required'),
    body('browser').optional().isIn(['chromium', 'firefox', 'webkit']),
    body('status').optional().isIn(['active', 'archived']),
    body('auth.type').optional().isIn(['none', 'basic', 'bearer', 'custom']),
    validate,
  ],
  environmentController.createEnvironment,
);

/**
 * @swagger
 * /api/environments:
 *   get:
 *     summary: Get all environments
 *     tags: [Environments]
 *     responses:
 *       200:
 *         description: List of environments
 */
router.get('/', environmentController.getAllEnvironments);

/**
 * @swagger
 * /api/environments/{id}:
 *   get:
 *     summary: Get an environment by ID
 *     tags: [Environments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Environment found
 *       404:
 *         description: Environment not found
 */
router.get('/:id', environmentController.getEnvironment);

/**
 * @swagger
 * /api/environments/{id}:
 *   patch:
 *     summary: Update an environment
 *     tags: [Environments]
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
 *             $ref: '#/components/schemas/Environment'
 *     responses:
 *       200:
 *         description: Environment updated successfully
 */
router.patch(
  '/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('baseUrl').optional().trim().notEmpty(),
    body('browser').optional().isIn(['chromium', 'firefox', 'webkit']),
    body('status').optional().isIn(['active', 'archived']),
    body('auth.type').optional().isIn(['none', 'basic', 'bearer', 'custom']),
    validate,
  ],
  environmentController.updateEnvironment,
);

/**
 * @swagger
 * /api/environments/{id}:
 *   delete:
 *     summary: Delete an environment
 *     tags: [Environments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Environment deleted successfully
 */
router.delete('/:id', environmentController.deleteEnvironment);

module.exports = router;
