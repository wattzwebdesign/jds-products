import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Create axios instance
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (username, password, jdsApiToken) => {
    const response = await apiClient.post('/auth/register', { username, password, jdsApiToken });
    return response.data;
  },

  login: async (username, password) => {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data;
  },

  updateJdsToken: async (jdsApiToken) => {
    const response = await apiClient.put('/auth/update-jds-token', { jdsApiToken });
    return response.data;
  }
};

// Products API
export const productsAPI = {
  lookupBySKUs: async (skuInput) => {
    const response = await apiClient.post('/products/lookup', { skuInput });
    return response.data;
  }
};

export default apiClient;
