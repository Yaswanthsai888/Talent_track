import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const evaluateTest = async (testId, answers) => {
  try {
    const response = await axios.post(`${API_URL}/evaluation/${testId}`, { answers });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to evaluate test');
  }
};

export const getTestResults = async (testId) => {
  try {
    const response = await axios.get(`${API_URL}/evaluation/${testId}/results`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch results');
  }
};

export const getTestAnalytics = async (testId) => {
  try {
    const response = await axios.get(`${API_URL}/evaluation/${testId}/analytics`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch analytics');
  }
};
