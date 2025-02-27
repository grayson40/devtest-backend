const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { APIError } = require('./errorHandler');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter for HTML files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/html' || path.extname(file.originalname).toLowerCase() === '.html') {
    cb(null, true);
  } else {
    cb(new APIError('Only HTML files are allowed', 400), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Middleware for handling HTML file uploads
const uploadHtml = upload.single('html');

// Wrapper to handle multer errors
const handleUpload = (req, res, next) => {
  uploadHtml(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new APIError('File size too large. Maximum size is 5MB', 400));
      }
      return next(new APIError(err.message, 400));
    } else if (err) {
      return next(err);
    }
    next();
  });
};

module.exports = {
  handleUpload,
  uploadDir
}; 