const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const { TestCase } = require('../../models');
const fs = require('fs').promises;
const path = require('path');

let exampleHtml; // Declare at module scope

// Use test database in Atlas
beforeAll(async () => {
  // Modify the Atlas URI to use a test database
  const atlasUri = process.env.MONGODB_URI.replace('/?', '/test?');
  process.env.MONGODB_URI = atlasUri;

  // Read example HTML
  exampleHtml = await fs.readFile(
    path.join(__dirname, '../../../docs/example-scribe.html'),
    'utf8',
  );
});

describe('Test Routes', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await TestCase.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/tests', () => {
    it('should create a new test case from HTML', async () => {
      const response = await request(app).post('/api/tests').send({ html: exampleHtml });

      // Log response body if test fails
      if (response.status !== 201) {
        console.log('Response body:', response.body);
      }

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe('How To Log In To DAW Hub');
      expect(response.body.data.steps).toHaveLength(8);
      expect(response.body.data.status).toBe('active');
    });

    it('should return 400 if HTML is missing', async () => {
      const response = await request(app).post('/api/tests').send({}).expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/tests', () => {
    it('should return all test cases', async () => {
      // Create a test case first
      const createResponse = await request(app).post('/api/tests').send({ html: exampleHtml });

      expect(createResponse.status).toBe(201);

      const response = await request(app).get('/api/tests').expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.results).toBe(1);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].title).toBe('How To Log In To DAW Hub');
    });
  });

  describe('GET /api/tests/:id', () => {
    it('should return a single test case', async () => {
      // Create a test case first
      const createResponse = await request(app).post('/api/tests').send({ html: exampleHtml });

      expect(createResponse.status).toBe(201);
      const testId = createResponse.body.data._id;

      const response = await request(app).get(`/api/tests/${testId}`).expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data._id).toBe(testId);
      expect(response.body.data.title).toBe('How To Log In To DAW Hub');
    });

    it('should return 404 for non-existent test case', async () => {
      const response = await request(app).get('/api/tests/5f7d3a2b1c9d440000000000').expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Test case not found');
    });

    it('should return 400 for invalid test ID', async () => {
      const response = await request(app).get('/api/tests/invalid-id').expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid test case ID');
    });
  });

  describe('PATCH /api/tests/:id', () => {
    it('should update a test case', async () => {
      // Create a test case first
      const createResponse = await request(app).post('/api/tests').send({ html: exampleHtml });

      expect(createResponse.status).toBe(201);
      const testId = createResponse.body.data._id;

      const response = await request(app)
        .patch(`/api/tests/${testId}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe('Updated Title');
    });
  });

  describe('DELETE /api/tests/:id', () => {
    it('should delete a test case', async () => {
      // Create a test case first
      const createResponse = await request(app).post('/api/tests').send({ html: exampleHtml });

      expect(createResponse.status).toBe(201);
      const testId = createResponse.body.data._id;

      await request(app).delete(`/api/tests/${testId}`).expect(204);

      // Verify the test case is deleted
      const response = await request(app).get(`/api/tests/${testId}`).expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Test case not found');
    });
  });
});
