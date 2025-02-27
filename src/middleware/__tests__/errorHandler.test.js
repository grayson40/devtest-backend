const { APIError, errorHandler } = require('../errorHandler');

describe('APIError', () => {
  it('should create an error with default status code', () => {
    const error = new APIError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.status).toBe('error');
  });

  it('should create an error with custom status code', () => {
    const error = new APIError('Bad request', 400);
    expect(error.message).toBe('Bad request');
    expect(error.statusCode).toBe(400);
    expect(error.status).toBe('error');
  });
});

describe('errorHandler middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  it('should handle errors in development mode', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Test error');
    error.stack = 'Error stack';

    errorHandler(error, mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Test error',
      stack: 'Error stack',
      error: error,
    });
  });

  it('should handle errors in production mode', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Test error');

    errorHandler(error, mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Test error',
    });
  });

  it('should use custom status code if provided', () => {
    const error = new APIError('Bad request', 400);

    errorHandler(error, mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Bad request',
    });
  });
}); 