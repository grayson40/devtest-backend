const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const { TestResult, TestCase, Environment } = require('../../models');

describe('Result Routes', () => {
  let testCase;
  let environment;

  beforeAll(async () => {
    // Create test dependencies
    testCase = await TestCase.create({
      title: 'Test Case for Results',
      description: 'Test case for testing results',
      steps: [
        {
          number: 1,
          description: 'Go to example.com',
          action: 'goto',
          value: 'https://example.com',
          selector: null,
        },
      ],
    });

    environment = await Environment.create({
      name: 'Test Environment',
      baseUrl: 'https://example.com',
      browser: 'chromium',
    });
  });

  beforeEach(async () => {
    await TestResult.deleteMany({});
  });

  afterAll(async () => {
    await TestResult.deleteMany({});
    await TestCase.deleteMany({});
    await Environment.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/results', () => {
    it('should create a new test result', async () => {
      const resultData = {
        testCase: testCase._id,
        environment: environment._id,
        status: 'passed',
        duration: 1500,
        metadata: {
          browser: 'chromium',
          viewport: { width: 1280, height: 720 },
        },
      };

      const response = await request(app).post('/api/results').send(resultData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.testCase.toString()).toBe(testCase._id.toString());
      expect(response.body.data.status).toBe('passed');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app).post('/api/results').send({
        testCase: testCase._id,
        status: 'passed',
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .post('/api/results')
        .send({
          testCase: testCase._id,
          environment: environment._id,
          status: 'invalid',
          duration: 1500,
          metadata: { browser: 'chromium' },
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/results', () => {
    beforeEach(async () => {
      await TestResult.create([
        {
          testCase: testCase._id,
          environment: environment._id,
          status: 'passed',
          duration: 1500,
          metadata: { browser: 'chromium' },
        },
        {
          testCase: testCase._id,
          environment: environment._id,
          status: 'failed',
          duration: 2000,
          metadata: { browser: 'firefox' },
        },
      ]);
    });

    it('should return all results', async () => {
      const response = await request(app).get('/api/results');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.results).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter results by status', async () => {
      const response = await request(app).get('/api/results').query({ status: 'passed' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('passed');
    });

    it('should paginate results', async () => {
      const response = await request(app).get('/api/results').query({ page: 1, limit: 1 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.pages).toBe(2);
    });
  });

  describe('GET /api/results/:id', () => {
    let testResult;

    beforeEach(async () => {
      testResult = await TestResult.create({
        testCase: testCase._id,
        environment: environment._id,
        status: 'passed',
        duration: 1500,
        metadata: { browser: 'chromium' },
      });
    });

    it('should return a result by ID', async () => {
      const response = await request(app).get(`/api/results/${testResult._id}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data._id).toBe(testResult._id.toString());
    });

    it('should return 404 for non-existent result', async () => {
      const response = await request(app).get(`/api/results/${new mongoose.Types.ObjectId()}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/results/:id', () => {
    let testResult;

    beforeEach(async () => {
      testResult = await TestResult.create({
        testCase: testCase._id,
        environment: environment._id,
        status: 'passed',
        duration: 1500,
        metadata: { browser: 'chromium' },
      });
    });

    it('should delete a result', async () => {
      const response = await request(app).delete(`/api/results/${testResult._id}`);

      expect(response.status).toBe(204);

      // Verify result is deleted
      const deleted = await TestResult.findById(testResult._id);
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent result', async () => {
      const response = await request(app).delete(`/api/results/${new mongoose.Types.ObjectId()}`);

      expect(response.status).toBe(404);
    });
  });
});
