import api from './api';

export const getRankedCandidates = async (testId, page = 1, limit = 10) => {
  try {
    const response = await api.get(`/ranking/${testId}/candidates?page=${page}&limit=${limit}`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch candidates');
  }
};

export const selectCandidates = async (testId, payload) => {
  try {
    const response = await api.post(`/ranking/${testId}/select`, payload);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to select candidates');
  }
};
