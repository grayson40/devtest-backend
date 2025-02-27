const fs = require('fs').promises;
const path = require('path');
const { APIError } = require('../middleware/errorHandler');
const { parseHtml } = require('../modules/parser/scribeParser');

/**
 * Handle Scribe HTML file upload and parsing
 */
exports.uploadScribeHtml = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new APIError('No file uploaded', 400);
    }

    // Read the uploaded file
    const filePath = req.file.path;
    const htmlContent = await fs.readFile(filePath, 'utf8');

    // Parse the HTML content
    const parsedData = await parseHtml(htmlContent);

    // Clean up the uploaded file
    await fs.unlink(filePath);

    res.status(200).json({
      status: 'success',
      data: parsedData,
    });
  } catch (error) {
    // Clean up file if it exists and there was an error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
};
