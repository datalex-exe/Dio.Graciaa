import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Automatically inject Authorization header if token exists in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dio_grace_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
