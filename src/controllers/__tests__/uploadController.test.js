const fs = require('fs');
const path = require('path');
const { parseHtml } = require('../../modules/parser/scribeParser');
const uploadController = require('../uploadController');

jest.mock('fs', () => ({
  readFile: jest.fn(),
  unlink: jest.fn(),
}));

jest.mock('../../modules/parser/scribeParser', () => ({
  parseHtml: jest.fn(),
}));

describe('Upload Controller', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    mockRequest = {
      file: {
        path: '/tmp/test.html',
        originalname: 'test.html',
      },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();

    jest.clearAllMocks();
  });

  it('should process uploaded file successfully', async () => {
    const mockFileContent = '<html><body>Test content</body></html>';
    const mockParsedData = { title: 'Test', steps: [] };

    fs.readFile.mockImplementation((path, encoding, callback) => {
      callback(null, mockFileContent);
    });

    parseHtml.mockResolvedValue(mockParsedData);
    fs.unlink.mockImplementation((path, callback) => {
      callback(null);
    });

    await uploadController.uploadScribeHtml(mockRequest, mockResponse, nextFunction);

    expect(fs.readFile).toHaveBeenCalledWith(
      mockRequest.file.path,
      'utf8',
      expect.any(Function)
    );
    expect(parseHtml).toHaveBeenCalledWith(mockFileContent);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'success',
      data: mockParsedData,
    });
    expect(fs.unlink).toHaveBeenCalledWith(
      mockRequest.file.path,
      expect.any(Function)
    );
  });

  it('should handle missing file error', async () => {
    mockRequest.file = undefined;

    await uploadController.uploadScribeHtml(mockRequest, mockResponse, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'No file uploaded',
      })
    );
  });

  it('should handle file read error', async () => {
    const readError = new Error('Read error');
    fs.readFile.mockImplementation((path, encoding, callback) => {
      callback(readError);
    });

    await uploadController.uploadScribeHtml(mockRequest, mockResponse, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(readError);
    expect(fs.unlink).toHaveBeenCalledWith(
      mockRequest.file.path,
      expect.any(Function)
    );
  });

  it('should handle HTML parsing error', async () => {
    const parseError = new Error('Parse error');
    fs.readFile.mockImplementation((path, encoding, callback) => {
      callback(null, '<html>test</html>');
    });
    parseHtml.mockRejectedValue(parseError);

    await uploadController.uploadScribeHtml(mockRequest, mockResponse, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(parseError);
    expect(fs.unlink).toHaveBeenCalledWith(
      mockRequest.file.path,
      expect.any(Function)
    );
  });

  it('should handle file cleanup error gracefully', async () => {
    const mockFileContent = '<html><body>Test content</body></html>';
    const mockParsedData = { title: 'Test', steps: [] };
    const cleanupError = new Error('Cleanup error');

    fs.readFile.mockImplementation((path, encoding, callback) => {
      callback(null, mockFileContent);
    });

    parseHtml.mockResolvedValue(mockParsedData);

    // First call unlink successfully, then fail on cleanup
    fs.unlink.mockImplementationOnce((path, callback) => {
      // Ensure response is sent before cleanup error occurs
      setImmediate(() => {
        callback(cleanupError);
      });
    });

    await uploadController.uploadScribeHtml(mockRequest, mockResponse, nextFunction);

    // Verify the response was sent before the cleanup error
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'success',
      data: mockParsedData,
    });

    // Wait for the cleanup error to be processed
    await new Promise(resolve => setImmediate(resolve));
    
    expect(fs.unlink).toHaveBeenCalledWith(
      mockRequest.file.path,
      expect.any(Function)
    );
    expect(nextFunction).toHaveBeenCalledWith(cleanupError);
  });
}); 