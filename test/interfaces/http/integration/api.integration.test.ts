import request from 'supertest';
import { Application } from 'express';
import { setupContainer } from '@/config/container';
import { createServer } from '@/interfaces/http/server';

describe('API Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    setupContainer();
    app = createServer();
  });

  describe('Health Endpoint', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health').expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('checks');
      expect(response.body).toHaveProperty('timestamp');
      expect(Array.isArray(response.body.checks)).toBe(true);
    });
  });

  describe('User Endpoints', () => {
    const authHeader = 'Basic ' + Buffer.from('admin:password').toString('base64');

    describe('POST /api/users', () => {
      it('should create a user with authentication', async () => {
        const userData = {
          email: 'integration@example.com',
          name: 'Integration Test User',
        };

        const response = await request(app)
          .post('/api/users')
          .set('Authorization', authHeader)
          .send(userData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('location');
        expect(response.body.location).toMatch(/\/users\/.+/);
        expect(response.headers['location']).toBe(response.body.location);
      });

      it('should return 401 without authentication', async () => {
        const userData = {
          email: 'test@example.com',
          name: 'Test User',
        };

        await request(app).post('/api/users').send(userData).expect(401);
      });

      it('should return 401 with invalid authentication', async () => {
        const invalidAuth = 'Basic ' + Buffer.from('invalid:credentials').toString('base64');
        const userData = {
          email: 'test@example.com',
          name: 'Test User',
        };

        await request(app)
          .post('/api/users')
          .set('Authorization', invalidAuth)
          .send(userData)
          .expect(401);
      });

      it('should return 400 for invalid email', async () => {
        const userData = {
          email: 'invalid-email',
          name: 'Test User',
        };

        await request(app)
          .post('/api/users')
          .set('Authorization', authHeader)
          .send(userData)
          .expect(400);
      });

      it('should return 400 for missing name', async () => {
        const userData = {
          email: 'test@example.com',
        };

        await request(app)
          .post('/api/users')
          .set('Authorization', authHeader)
          .send(userData)
          .expect(400);
      });

      it('should return 409 for duplicate email', async () => {
        const userData = {
          email: 'duplicate@example.com',
          name: 'First User',
        };

        await request(app)
          .post('/api/users')
          .set('Authorization', authHeader)
          .send(userData)
          .expect(201);

        const duplicateData = {
          email: 'duplicate@example.com',
          name: 'Second User',
        };

        await request(app)
          .post('/api/users')
          .set('Authorization', authHeader)
          .send(duplicateData)
          .expect(409);
      });
    });

    describe('GET /api/users/:id', () => {
      it('should get a user by ID with authentication', async () => {
        const userData = {
          email: 'gettest@example.com',
          name: 'Get Test User',
        };

        const createResponse = await request(app)
          .post('/api/users')
          .set('Authorization', authHeader)
          .send(userData)
          .expect(201);

        const userId = createResponse.body.id;

        const getResponse = await request(app)
          .get(`/api/users/${userId}`)
          .set('Authorization', authHeader)
          .expect(200);

        expect(getResponse.body).toEqual({
          id: userId,
          email: userData.email,
          name: userData.name,
        });
      });

      it('should return 401 without authentication', async () => {
        await request(app).get('/api/users/some-id').expect(401);
      });

      it('should return 404 for non-existent user', async () => {
        await request(app)
          .get('/api/users/non-existent-id')
          .set('Authorization', authHeader)
          .expect(404);
      });
    });
  });

  describe('Root Endpoint', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/').expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('health');
      expect(response.body.endpoints).toHaveProperty('users');
    });
  });
});
