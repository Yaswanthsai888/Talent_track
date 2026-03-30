const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';
let authToken = '';

async function runTests() {
    try {
        // Test 1: Register
        console.log('Testing registration...');
        const registerRes = await axios.post(`${API_URL}/users/register`, {
            name: 'Test User',
            email: 'test@example.com',
            password: 'Test123!',
            role: 'user'
        });
        console.log('Registration successful');

        // Test 2: Login
        console.log('Testing login...');
        const loginRes = await axios.post(`${API_URL}/users/login`, {
            email: 'test@example.com',
            password: 'Test123!'
        });
        authToken = loginRes.data.token;
        console.log('Login successful');

        // Test 3: Resume Upload
        console.log('Testing resume upload...');
        const formData = new FormData();
        formData.append('resume', fs.createReadStream(path.join(__dirname, '../python-services/resume-parser/test_resumes/data_scientist_resume.pdf')));
        
        const uploadRes = await axios.post(`${API_URL}/users/upload-resume`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${authToken}`
            }
        });
        console.log('Resume upload successful:', uploadRes.data.skills);

    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
}

runTests();
