const express = require('express');
const { handleUpload } = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

/**
 * @swagger
 * /api/upload/scribe:
 *   post:
 *     summary: Upload and parse a Scribe HTML file
 *     tags: [Upload]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - html
 *             properties:
 *               html:
 *                 type: string
 *                 format: binary
 *                 description: HTML file to upload
 *     responses:
 *       200:
 *         description: File uploaded and parsed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     steps:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Invalid file or upload error
 */
router.post('/scribe', handleUpload, uploadController.uploadScribeHtml);

module.exports = router;