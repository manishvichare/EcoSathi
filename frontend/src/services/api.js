import axios from 'axios';

// Get base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120 seconds — Ollama LLM calls can take 15-60s on local hardware
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Adds auth token to requests if available
 */
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage if it exists
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handle errors globally
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common HTTP errors
    const requestUrl = error.config?.url || '';
    const isAuthRoute =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/send-otp') ||
      requestUrl.includes('/auth/verify-otp') ||
      requestUrl.includes('/auth/me');

    if (error.response?.status === 401) {
      // Clear token only
      localStorage.removeItem('authToken');
      // Only redirect if NOT on the login page and NOT attempting to authenticate
      if (!isAuthRoute && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      console.error('Access denied');
    }
    
    if (error.response?.status === 404) {
      // Not found
      console.error('Resource not found');
    }
    
    if (error.response?.status >= 500) {
      // Server error
      console.error('Server error');
    }
    
    return Promise.reject(error);
  }
);

export default api;