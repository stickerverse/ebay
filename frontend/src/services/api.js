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
  (response) => response.data, // Return data directly
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Enhance error message handling
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message || 
                        'An unexpected error occurred';
    
    error.message = errorMessage;
    return Promise.reject(error);
  }
);

export const messageAPI = {
  sync: async () => {
    try {
      const response = await api.get('/messages/sync');
      return response;
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  },

  getMessages: async (params = {}) => {
    try {
      const response = await api.get('/messages', { params });
      return response;
    } catch (error) {
      console.error('Get messages error:', error);
      throw error;
    }
  },

  respond: async (messageId, responseText) => {
    try {
      if (!messageId || !responseText?.trim()) {
        throw new Error('Message ID and response text are required');
      }
      
      const response = await api.post(`/messages/${messageId}/respond`, { 
        responseText: responseText.trim() 
      });
      return response;
    } catch (error) {
      console.error('Respond error:', error);
      throw error;
    }
  },

  getStats: async (timeRange = '7d') => {
    try {
      const response = await api.get('/messages/stats', { 
        params: { timeRange } 
      });
      return response;
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  }
};

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response;
  },

  configureEbay: async (credentials) => {
    const response = await api.post('/auth/configure-ebay', credentials);
    return response;
  }
};

export const settingsAPI = {
  get: async () => {
    const response = await api.get('/settings');
    return response;
  },

  update: async (settings) => {
    const response = await api.put('/settings', { settings });
    return response;
  }
};

export const analyticsAPI = {
  getStats: async (timeRange = '7d') => {
    try {
      const response = await api.get('/analytics/stats', { 
        params: { timeRange } 
      });
      return response;
    } catch (error) {
      // Return mock data if analytics endpoint doesn't exist yet
      console.warn('Analytics API not available, returning mock data');
      return {
        success: true,
        stats: {
          totalMessages: 148,
          autoResponded: 92,
          averageResponseTime: '4.2 minutes',
          responseRate: '89%'
        }
      };
    }
  },

  getChartData: async (type = 'messages', timeRange = '7d') => {
    try {
      const response = await api.get(`/analytics/chart/${type}`, {
        params: { timeRange }
      });
      return response;
    } catch (error) {
      // Return mock data if analytics endpoint doesn't exist yet
      console.warn('Analytics chart API not available, returning mock data');
      return {
        success: true,
        data: [
          { name: 'Mon', messages: 12, responses: 10 },
          { name: 'Tue', messages: 19, responses: 15 },
          { name: 'Wed', messages: 15, responses: 13 },
          { name: 'Thu', messages: 22, responses: 18 },
          { name: 'Fri', messages: 18, responses: 16 },
          { name: 'Sat', messages: 8, responses: 6 },
          { name: 'Sun', messages: 5, responses: 4 }
        ]
      };
    }
  }
};

// Health check utility
export const healthAPI = {
  check: async () => {
    try {
      const response = await api.get('/health');
      return response;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
};

export default api;