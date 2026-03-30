import api from './api';

export const getTestAnalytics = async (testId) => {
  try {
    const response = await api.get(`/analytics/test/${testId}`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch analytics');
  }
};

export const getOverallAnalytics = async () => {
  try {
    const response = await api.get('/analytics/overview');
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch overview analytics');
  }
};
