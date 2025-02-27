const mongoose = require('mongoose');
const { TestResult } = require('../../models');
const { APIError } = require('../../middleware/errorHandler');
const resultController = require('../resultController');

// Mock TestResult model
jest.mock('../../models', () => ({
  TestResult: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

describe('Result Controller', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();

    jest.clearAllMocks();
  });

  describe('createResult', () => {
    it('should create a new test result', async () => {
      const mockResult = {
        _id: new mongoose.Types.ObjectId(),
        testCase: new mongoose.Types.ObjectId(),
        environment: new mongoose.Types.ObjectId(),
        status: 'passed',
        duration: 1500,
        metadata: { browser: 'chromium' },
      };

      mockRequest.body = mockResult;
      TestResult.create.mockResolvedValue(mockResult);

      await resultController.createResult(mockRequest, mockResponse, nextFunction);

      expect(TestResult.create).toHaveBeenCalledWith(mockResult);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockResult,
      });
    }, 15000);

    it('should handle validation errors', async () => {
      const validationError = new mongoose.Error.ValidationError();
      TestResult.create.mockRejectedValue(validationError);

      await resultController.createResult(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(APIError));
      expect(nextFunction.mock.calls[0][0].statusCode).toBe(400);
    }, 15000);
  });

  describe('getAllResults', () => {
    it('should return all results with pagination', async () => {
      const mockResults = [
        { _id: new mongoose.Types.ObjectId(), status: 'passed' },
        { _id: new mongoose.Types.ObjectId(), status: 'failed' },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockResults),
      };

      TestResult.find.mockReturnValue(mockQuery);
      TestResult.countDocuments.mockResolvedValue(2);
      mockRequest.query = { page: '1', limit: '10' };

      await resultController.getAllResults(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        results: 2,
        pagination: {
          total: 2,
          page: 1,
          pages: 1,
        },
        data: mockResults,
      });
    }, 15000);

    it('should apply filters correctly', async () => {
      const mockFilter = {
        status: 'passed',
        testCase: new mongoose.Types.ObjectId().toString(),
      };
      mockRequest.query = { ...mockFilter, page: '1', limit: '10' };

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([]),
      };

      TestResult.find.mockReturnValue(mockQuery);
      TestResult.countDocuments.mockResolvedValue(0);

      await resultController.getAllResults(mockRequest, mockResponse, nextFunction);

      expect(TestResult.find).toHaveBeenCalledWith(expect.objectContaining(mockFilter));
    }, 15000);
  });

  describe('getResult', () => {
    it('should return a result by ID', async () => {
      const mockResult = {
        _id: new mongoose.Types.ObjectId(),
        status: 'passed',
      };

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockResult),
      };

      TestResult.findById.mockReturnValue(mockQuery);
      mockRequest.params.id = mockResult._id.toString();

      await resultController.getResult(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockResult,
      });
    }, 15000);

    it('should handle not found error', async () => {
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null),
      };

      TestResult.findById.mockReturnValue(mockQuery);
      mockRequest.params.id = new mongoose.Types.ObjectId().toString();

      await resultController.getResult(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Test result not found',
        }),
      );
    }, 15000);
  });

  describe('deleteResult', () => {
    it('should delete a result', async () => {
      const mockResult = {
        _id: new mongoose.Types.ObjectId(),
        deleteOne: jest.fn().mockResolvedValue({}),
      };

      TestResult.findById.mockResolvedValue(mockResult);
      mockRequest.params.id = mockResult._id.toString();

      await resultController.deleteResult(mockRequest, mockResponse, nextFunction);

      expect(mockResult.deleteOne).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: null,
      });
    }, 15000);

    it('should handle not found error', async () => {
      TestResult.findById.mockResolvedValue(null);
      mockRequest.params.id = new mongoose.Types.ObjectId().toString();

      await resultController.deleteResult(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Test result not found',
        }),
      );
    }, 15000);
  });
});
