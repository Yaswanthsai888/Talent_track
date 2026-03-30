import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true,
    timeout: 10000 // 10 seconds timeout
});

// Add request interceptor to handle auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('Request Config:', config);
        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

export const register = async (userData) => {
    try {
        console.log('Registration User Data:', userData);
        const response = await api.post('/auth/register', userData);
        return response.data;
    } catch (error) {
        console.error('Registration Error:', error.response?.data || error.message);
        throw error.response?.data || { message: 'Registration failed' };
    }
};

// Add token to requests
api.interceptors.request.use(
    (config) => {
        console.log('Request Config:', {
            url: config.url,
            method: config.method,
            headers: config.headers
        });

        const user = getCurrentUser();
        if (user?.token) {
            config.headers['Authorization'] = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request Interceptor Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for global error handling
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', {
            status: response.status,
            data: response.data
        });
        return response;
    },
    (error) => {
        console.error('API Error Details:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        // Specific error handling
        if (error.response) {
            // The request was made and the server responded with a status code
            switch (error.response.status) {
                case 400:
                    console.error('Bad Request:', error.response.data);
                    break;
                case 401:
                    console.error('Unauthorized:', error.response.data);
                    break;
                case 403:
                    console.error('Forbidden:', error.response.data);
                    break;
                case 404:
                    console.error('Not Found:', error.response.data);
                    break;
                case 500:
                    console.error('Server Error:', error.response.data);
                    break;
            }
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.request);
        } else {
            // Something happened in setting up the request
            console.error('Error setting up request:', error.message);
        }

        return Promise.reject(error);
    }
);

// Create an authenticated Axios instance
const createAuthenticatedRequest = () => {
  const token = localStorage.getItem('token');
  const user = getCurrentUser();
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  console.log('Creating authenticated request:', {
    tokenExists: !!token,
    userInfo: user ? { id: user.id, role: user.role } : null,
    baseURL
  });

  // Validate token and user
  if (!token) {
    console.error('No authentication token found');
    throw new Error('No authentication token, please log in');
  }

  if (!user) {
    console.error('No user information found');
    throw new Error('User information missing, please log in');
  }

  return axios.create({
    baseURL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

export const getCurrentUser = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
        return null;
    }
    
    const user = JSON.parse(userStr);
    return { ...user, token };
};

export const login = async (credentials) => {
    try {
        console.log('Login Credentials:', credentials);
        const response = await api.post('/auth/login', credentials);
        console.log('Login Response:', response.data);

        if (response.data.success && response.data.data) {
            const userData = response.data.data;
            // Store token and user info
            localStorage.setItem('token', userData.token);
            localStorage.setItem('user', JSON.stringify({
                id: userData._id,
                name: userData.name,
                email: userData.email,
                role: userData.role
            }));
            
            return {
                token: userData.token,
                user: {
                    id: userData._id,
                    name: userData.name,
                    email: userData.email,
                    role: userData.role
                }
            };
        }
        
        throw new Error('Invalid response format');
    } catch (error) {
        console.error('Login Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        throw error.response?.data || { message: 'Login failed' };
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getAllUsers = async () => {
    try {
        console.log('Getting all users...');
        const response = await createAuthenticatedRequest().get('/users/all');
        console.log('All users:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error getting all users:', error.response?.data || error.message);
        throw error;
    }
};

export const getUserProfile = async () => {
    try {
        console.log('Getting user profile...');
        const response = await api.get('/users/profile');
        console.log('User profile:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error getting user profile:', error.response || error);
        throw error.response?.data || error.message;
    }
};

export const uploadResume = async (file) => {
    const formData = new FormData();
    formData.append('resume', file);

    try {
        console.log('Uploading resume...');
        const response = await api.post('/users/upload-resume', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        console.log('Resume uploaded:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error uploading resume:', error.response || error);
        throw error.response?.data || { message: 'Resume upload failed' };
    }
};

export const createJob = async (jobData) => {
    try {
        console.log('Creating job...');
        const response = await api.post('/jobs', jobData);
        console.log('Job created:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating job:', error.response || error);
        throw error.response?.data || error.message;
    }
};

export const getAllJobs = async (page = 1, limit = 10) => {
    try {
        console.log('Getting all jobs...');
        const response = await api.get(`/jobs?page=${page}&limit=${limit}`);
        console.log('All jobs:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error getting all jobs:', error.response || error);
        throw error.response?.data || error.message;
    }
};

export const getMatchedJobs = async () => {
    try {
        console.log('Getting matched jobs...');
        const response = await api.get('/jobs/matched');
        console.log('Matched jobs:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error getting matched jobs:', error.response || error);
        throw error.response?.data || error.message;
    }
};

export const getAdminJobs = async () => {
    try {
        console.log('Getting admin jobs...');
        const response = await createAuthenticatedRequest().get('/jobs/my-postings');
        console.log('Admin jobs response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error getting admin jobs:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            headers: error.config?.headers,
            fullError: error
        });
        
        // Throw a more informative error
        if (error.response) {
            const errorMessage = error.response.data?.error || 
                                 error.response.data?.details || 
                                 'Failed to retrieve job postings';
            throw new Error(errorMessage);
        }
        
        throw error;
    }
};

export const updateJob = async (jobId, jobData) => {
    try {
        console.log('Updating job...');
        const response = await api.put(`/jobs/${jobId}`, jobData);
        console.log('Job updated:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error updating job:', error.response || error);
        throw error.response?.data || error.message;
    }
};

export const deleteJob = async (jobId) => {
    try {
        console.log('Deleting job...');
        const response = await api.delete(`/jobs/${jobId}`);
        console.log('Job deleted:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error deleting job:', error.response || error);
        throw error.response?.data || error.message;
    }
};

// Job-Test Management Methods

export const createJobTest = async (jobId, testData) => {
    try {
        console.log('Creating test for job...');
        const response = await api.post(`/jobs/${jobId}/tests`, testData);
        console.log('Job test created:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating job test:', error.response || error);
        throw error.response?.data || error.message;
    }
};

export const getJobTests = async (jobId) => {
    try {
        console.log('Getting tests for job...');
        const response = await api.get(`/jobs/${jobId}/tests`);
        console.log('Job tests:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error getting job tests:', error.response || error);
        throw error.response?.data || error.message;
    }
};

export const startTest = async (testId) => {
    try {
        console.log('Starting test...');
        const response = await api.post(`/tests/${testId}/start`);
        console.log('Test started:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error starting test:', error.response || error);
        throw error.response?.data || error.message;
    }
};

export const submitTest = async (testId, testAttemptId, answers) => {
    try {
        console.log('Submitting test...');
        const response = await api.post(`/tests/${testId}/submit`, { 
            testAttemptId, 
            answers 
        });
        console.log('Test submitted:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error submitting test:', error.response || error);
        throw error.response?.data || error.message;
    }
};

export const getJobTestResults = async (jobId) => {
    try {
        console.log('Getting test results for job...');
        const response = await api.get(`/tests/job/${jobId}/results`);
        console.log('Job test results:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error getting job test results:', error.response || error);
        throw error.response?.data || error.message;
    }
};

// User Test Management Methods
export const getUserTests = async () => {
    try {
        console.log('Fetching user tests...');
        const response = await createAuthenticatedRequest().get('/user/tests');
        console.log('User tests response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error getting user tests:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            headers: error.config?.headers
        });
        
        // Throw a more informative error
        if (error.response) {
            throw new Error(error.response.data?.error || 'Failed to retrieve user tests');
        }
        
        throw error;
    }
};

export const getUserTestStats = async () => {
    try {
        console.log('Fetching user test stats...');
        const response = await createAuthenticatedRequest().get('/user/test-stats');
        console.log('User test stats response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error getting user test stats:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            headers: error.config?.headers
        });
        
        // Throw a more informative error
        if (error.response) {
            throw new Error(error.response.data?.error || 'Failed to retrieve user test statistics');
        }
        
        throw error;
    }
};

export default api;
