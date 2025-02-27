const path = require('path');
const multer = require('multer');
const { uploadMiddleware, uploadDir } = require('../upload');
const { APIError } = require('../errorHandler');

// Mock multer
jest.mock('multer', () => {
  const mockMiddleware = jest.fn((req, res, next) => next());
  return jest.fn(() => ({
    single: jest.fn(() => mockMiddleware)
  }));
});

describe('Upload Middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should set up multer with correct configuration', () => {
    expect(uploadDir).toBeDefined();
    expect(path.basename(uploadDir)).toBe('uploads');
  });

  it('should handle successful file upload', () => {
    const middleware = uploadMiddleware;
    middleware(mockRequest, mockResponse, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
    expect(nextFunction).not.toHaveBeenCalledWith(expect.any(Error));
  });

  it('should handle file size error', () => {
    const multerInstance = multer();
    const sizeError = new Error('File too large');
    sizeError.code = 'LIMIT_FILE_SIZE';
    
    multerInstance.single('file').mockImplementationOnce((req, res, next) => {
      next(sizeError);
    });

    const middleware = uploadMiddleware;
    middleware(mockRequest, mockResponse, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'File size limit exceeded'
      })
    );
  });

  it('should handle other multer errors', () => {
    const multerInstance = multer();
    const multerError = new Error('Multer error');
    
    multerInstance.single('file').mockImplementationOnce((req, res, next) => {
      next(multerError);
    });

    const middleware = uploadMiddleware;
    middleware(mockRequest, mockResponse, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Error uploading file'
      })
    );
  });

  it('should handle non-multer errors', () => {
    const multerInstance = multer();
    const genericError = new Error('Generic error');
    
    multerInstance.single('file').mockImplementationOnce((req, res, next) => {
      next(genericError);
    });

    const middleware = uploadMiddleware;
    middleware(mockRequest, mockResponse, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(genericError);
  });
}); 