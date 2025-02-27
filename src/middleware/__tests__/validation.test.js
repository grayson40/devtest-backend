const { validate } = require('../validation');
const { validationResult } = require('express-validator');

// Mock express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

describe('Validation Middleware', () => {
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

  it('should call next() when there are no validation errors', () => {
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });

    validate(mockRequest, mockResponse, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it('should return 400 status with errors when validation fails', () => {
    const mockErrors = [
      { param: 'name', msg: 'Name is required' },
      { param: 'email', msg: 'Invalid email format' },
    ];

    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => mockErrors,
    });

    validate(mockRequest, mockResponse, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      errors: mockErrors,
    });
  });

  it('should properly handle empty errors array', () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [],
    });

    validate(mockRequest, mockResponse, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      errors: [],
    });
  });
}); 