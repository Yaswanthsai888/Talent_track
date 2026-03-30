const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');
const Job = require('../models/Job');
const { generateToken } = require('../utils/auth');

describe('Job Management', () => {
    let adminToken;
    let userToken;
    
    beforeAll(async () => {
        adminToken = generateToken({ id: 'admin-id', role: 'admin' });
        userToken = generateToken({ id: 'user-id', role: 'user' });
    });

    test('Create Job', async () => {
        const response = await request(app)
            .post('/api/jobs')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: 'Software Engineer',
                description: 'Test job description',
                requiredSkills: ['JavaScript', 'React']
            });
        
        expect(response.status).toBe(201);
        expect(response.body.title).toBe('Software Engineer');
    });
    
    test('Match Jobs', async () => {
        const response = await request(app)
            .get('/api/jobs/matched')
            .set('Authorization', `Bearer ${userToken}`);
            
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.jobs)).toBe(true);
    });

    test('Non-admin cannot create job', async () => {
        const response = await request(app)
            .post('/api/jobs')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                title: 'Test Job',
                description: 'Test Description',
                requiredSkills: ['JavaScript']
            });
        
        expect(response.status).toBe(403);
    });
});
