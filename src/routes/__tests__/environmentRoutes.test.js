const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const { Environment } = require('../../models');

describe('Environment Routes', () => {
  beforeEach(async () => {
    await Environment.deleteMany({});
  });

  afterAll(async () => {
    await Environment.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/environments', () => {
    it('should create a new environment', async () => {
      const response = await request(app)
        .post('/api/environments')
        .send({
          name: 'Production',
          baseUrl: 'https://example.com',
          description: 'Production environment',
          browser: 'chromium',
          variables: {
            API_KEY: 'test-key',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.name).toBe('Production');
      expect(response.body.data.baseUrl).toBe('https://example.com');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app).post('/api/environments').send({
        baseUrl: 'https://example.com',
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 if baseUrl is missing', async () => {
      const response = await request(app).post('/api/environments').send({
        name: 'Production',
      });

      expect(response.status).toBe(400);
    });

    it('should prevent duplicate environment names', async () => {
      // Create first environment
      await request(app).post('/api/environments').send({
        name: 'Production',
        baseUrl: 'https://example.com',
      });

      // Try to create another with same name
      const response = await request(app).post('/api/environments').send({
        name: 'Production',
        baseUrl: 'https://other.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /api/environments', () => {
    beforeEach(async () => {
      await Environment.create([
        {
          name: 'Production',
          baseUrl: 'https://example.com',
        },
        {
          name: 'Staging',
          baseUrl: 'https://staging.example.com',
        },
      ]);
    });

    it('should return all environments', async () => {
      const response = await request(app).get('/api/environments');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('baseUrl');
    });
  });

  describe('GET /api/environments/:id', () => {
    let environment;

    beforeEach(async () => {
      environment = await Environment.create({
        name: 'Production',
        baseUrl: 'https://example.com',
      });
    });

    it('should return an environment by ID', async () => {
      const response = await request(app).get(`/api/environments/${environment._id}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data._id).toBe(environment._id.toString());
      expect(response.body.data.name).toBe('Production');
    });

    it('should return 404 for non-existent environment', async () => {
      const response = await request(app).get(`/api/environments/${new mongoose.Types.ObjectId()}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/environments/:id', () => {
    let environment;

    beforeEach(async () => {
      environment = await Environment.create({
        name: 'Production',
        baseUrl: 'https://example.com',
      });
    });

    it('should update an environment', async () => {
      const response = await request(app).patch(`/api/environments/${environment._id}`).send({
        name: 'Updated Production',
        description: 'Updated description',
      });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Production');
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should prevent updating to existing environment name', async () => {
      // Create another environment
      await Environment.create({
        name: 'Staging',
        baseUrl: 'https://staging.example.com',
      });

      // Try to update to existing name
      const response = await request(app).patch(`/api/environments/${environment._id}`).send({
        name: 'Staging',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('DELETE /api/environments/:id', () => {
    let environment;

    beforeEach(async () => {
      environment = await Environment.create({
        name: 'Production',
        baseUrl: 'https://example.com',
      });
    });

    it('should delete an environment', async () => {
      const response = await request(app).delete(`/api/environments/${environment._id}`);

      expect(response.status).toBe(204);

      // Verify environment is deleted
      const deleted = await Environment.findById(environment._id);
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent environment', async () => {
      const response = await request(app).delete(
        `/api/environments/${new mongoose.Types.ObjectId()}`,
      );

      expect(response.status).toBe(404);
    });
  });
});
