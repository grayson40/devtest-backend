const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const { TestCase, TestSequence } = require('../../models');

describe('Sequence Routes', () => {
  let testCase;

  beforeAll(async () => {
    // Create a test case to use in sequences
    testCase = await TestCase.create({
      title: 'Test for Sequence',
      description: 'A test case for sequence testing',
      html: '<div>Test content</div>',
      status: 'active',
    });
  });

  afterAll(async () => {
    await TestCase.deleteMany({});
    await TestSequence.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/sequences', () => {
    it('should create a new sequence', async () => {
      const response = await request(app)
        .post('/api/sequences')
        .send({
          name: 'Login Flow',
          description: 'Test sequence for login flow',
          tests: [
            {
              testId: testCase._id,
              order: 1,
            },
          ],
          environment: {
            baseUrl: 'https://example.com',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.name).toBe('Login Flow');
      expect(response.body.data.tests).toHaveLength(1);
      expect(response.body.data.tests[0].testId.toString()).toBe(testCase._id.toString());
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/sequences')
        .send({
          description: 'Test sequence',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 if test ID is invalid', async () => {
      const response = await request(app)
        .post('/api/sequences')
        .send({
          name: 'Invalid Test ID',
          tests: [
            {
              testId: new mongoose.Types.ObjectId(),
              order: 1,
            },
          ],
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/sequences', () => {
    it('should return all sequences', async () => {
      const response = await request(app).get('/api/sequences');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/sequences/:id', () => {
    let sequence;

    beforeAll(async () => {
      sequence = await TestSequence.create({
        name: 'Test Sequence',
        tests: [{ testId: testCase._id, order: 1 }],
      });
    });

    it('should return a sequence by ID', async () => {
      const response = await request(app)
        .get(`/api/sequences/${sequence._id}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data._id).toBe(sequence._id.toString());
    });

    it('should return 404 for non-existent sequence', async () => {
      const response = await request(app)
        .get(`/api/sequences/${new mongoose.Types.ObjectId()}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/sequences/:id', () => {
    let sequence;

    beforeAll(async () => {
      sequence = await TestSequence.create({
        name: 'Update Test',
        tests: [{ testId: testCase._id, order: 1 }],
      });
    });

    it('should update a sequence', async () => {
      const response = await request(app)
        .patch(`/api/sequences/${sequence._id}`)
        .send({
          name: 'Updated Name',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should return 404 for non-existent sequence', async () => {
      const response = await request(app)
        .patch(`/api/sequences/${new mongoose.Types.ObjectId()}`)
        .send({ name: 'New Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/sequences/:id', () => {
    let sequence;

    beforeAll(async () => {
      sequence = await TestSequence.create({
        name: 'Delete Test',
        tests: [{ testId: testCase._id, order: 1 }],
      });
    });

    it('should delete a sequence', async () => {
      const response = await request(app)
        .delete(`/api/sequences/${sequence._id}`);

      expect(response.status).toBe(204);

      // Verify sequence is deleted
      const deleted = await TestSequence.findById(sequence._id);
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent sequence', async () => {
      const response = await request(app)
        .delete(`/api/sequences/${new mongoose.Types.ObjectId()}`);

      expect(response.status).toBe(404);
    });
  });
}); 