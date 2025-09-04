import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const messageAPI = {
  sync: () => api.get('/messages/sync'),
  getMessages: (params) => api.get('/messages', { params }),
  respond: (messageId, responseText) => api.post(`/messages/${messageId}/respond`, { responseText })
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (settings) => api.put('/settings', settings)
};

export const analyticsAPI = {
  getStats: () => api.get('/analytics/stats'),
  getChartData: (type) => api.get(`/analytics/chart/${type}`)
};

export default api;
