const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const Test = require('../../models/Test');
const { setupTestDB } = require('../utils/testSetup');

setupTestDB();

describe('Test APIs', () => {
  let authToken;
  let testId;

  beforeAll(async () => {
    // Login and get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });
    authToken = loginRes.body.token;
  });

  describe('POST /api/tests', () => {
    it('should create a new test', async () => {
      const res = await request(app)
        .post('/api/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          jobId: mongoose.Types.ObjectId(),
          testType: 'aptitude',
          timeLimit: 60
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      testId = res.body.data._id;
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/tests/:testId', () => {
    it('should get test by id', async () => {
      const res = await request(app)
        .get(`/api/tests/${testId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(testId);
    });

    it('should handle invalid test id', async () => {
      const res = await request(app)
        .get('/api/tests/invalidid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });
  });
});
