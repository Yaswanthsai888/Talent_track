const axios = require('axios');

const JUDGE0_API = process.env.JUDGE0_API || 'http://localhost:2358';
const JUDGE0_TOKEN = process.env.JUDGE0_TOKEN;

const LANGUAGE_IDS = {
  'javascript': 63,
  'python': 71,
  'java': 62
};

const createSubmission = async (code, language, input) => {
  try {
    const response = await axios.post(`${JUDGE0_API}/submissions`, {
      source_code: code,
      language_id: LANGUAGE_IDS[language],
      stdin: input,
      cpu_time_limit: 2, // 2 seconds
      memory_limit: 128000 // 128MB
    }, {
      headers: { 'X-Auth-Token': JUDGE0_TOKEN }
    });
    
    return response.data.token;
  } catch (error) {
    throw new Error('Failed to create code submission');
  }
};

const getSubmissionResult = async (token) => {
  try {
    const response = await axios.get(`${JUDGE0_API}/submissions/${token}`, {
      headers: { 'X-Auth-Token': JUDGE0_TOKEN }
    });
    
    return {
      status: response.data.status,
      stdout: response.data.stdout,
      stderr: response.data.stderr,
      time: response.data.time,
      memory: response.data.memory
    };
  } catch (error) {
    throw new Error('Failed to get submission result');
  }
};

module.exports = {
  createSubmission,
  getSubmissionResult
};
