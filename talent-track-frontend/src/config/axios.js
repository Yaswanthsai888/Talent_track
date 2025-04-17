import axios from 'axios';

// Determine the backend URL based on environment
const backendUrl = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : 'https://talent-track-backend.onrender.com/api';

// Main backend instance
const instance = axios.create({
  baseURL: backendUrl,
  timeout: 10000,
  withCredentials: false, // Changed to false since we're using token auth
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

// Add request interceptor to attach auth token
instance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // If we're sending FormData, let the browser set the Content-Type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for auth and error handling
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 unauthorized errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // Log errors for debugging
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });

    return Promise.reject(error);
  }
);

export default instance;
