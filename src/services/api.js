// src/services/api.js

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false // Set to false since we're using token-based auth
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    return Promise.reject(error);
  }
);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Add an interceptor to handle CORS issues
api.interceptors.request.use(
  config => {
    // For distribution updates, convert PATCH to PUT
    if (config.method === 'patch' && config.url.includes('/sd/distribute')) {
      config.method = 'put';
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Method for locking materials
api.lockMaterials = async (materials) => {
  return api.post('/requests/lock-materials', { materials });
};

export default api;
