import axios from 'axios';

// Main backend instance
const instance = axios.create({
  baseURL: 'https://talent-track-backend.onrender.com', // Removed /api since it's added in routes
  timeout: 10000, // Increased timeout for file uploads
  withCredentials: true, // Changed to true to send credentials
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// FastAPI instance
export const fastApiInstance = axios.create({
  baseURL: 'https://talent-track-resume-parser.onrender.com',
  timeout: 5000,
  withCredentials: false,
  headers: {
    'Content-Type': 'multipart/form-data',
    'Accept': 'application/json'
  }
});

// Main backend interceptors
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // If we're sending FormData, let the browser set the correct Content-Type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Add error handling interceptor
instance.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

// FastAPI interceptors
fastApiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('FastAPI Error:', error);
    return Promise.reject(error);
  }
);

export default instance;
