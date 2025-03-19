// src/services/api.js

import axios from 'axios';

// Use environment variable with fallback for local development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Remove this line before production deployment
// console.log('API URL:', API_URL); 

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

// Method for locking materials
api.lockMaterials = async (materials) => {
  return api.post('/requests/lock-materials', { materials });
};

export default api;
