import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Create axios instance
// Note: For production (nginx), we use api.php with query parameters
// For development (local), we use direct API calls
const isProduction = API_BASE_URL.includes('1wp.site');
const apiClient = axios.create({
  baseURL: isProduction ? `${API_BASE_URL}/api.php` : `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Transform requests for production nginx environment
if (isProduction) {
  apiClient.interceptors.request.use(
    (config) => {
      // Convert /auth/register to ?endpoint=/auth/register
      const endpoint = config.url;
      config.url = '';
      config.params = { ...config.params, endpoint };
      return config;
    }
  );
}

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
  },

  search: async (query, filters = {}, page = 1, limit = 20) => {
    const response = await apiClient.post('/products/search', {
      query,
      filters,
      page,
      limit
    });
    return response.data;
  },

  getLiveProduct: async (sku) => {
    const response = await apiClient.get(`/products/${sku}/live`);
    return response.data;
  },

  getColors: async () => {
    const response = await apiClient.get('/products/filters/colors');
    return response.data;
  }
};

// Admin API
export const adminAPI = {
  importProducts: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/admin/import-products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getImportStats: async () => {
    const response = await apiClient.get('/admin/import-stats');
    return response.data;
  },

  syncNow: async () => {
    const response = await apiClient.post('/admin/sync-now');
    return response.data;
  },

  getSyncStatus: async () => {
    const response = await apiClient.get('/admin/sync-status');
    return response.data;
  },

  addMissingProducts: async (skus) => {
    const response = await apiClient.post('/admin/add-missing-products', { skus });
    return response.data;
  }
};

export default apiClient;
