import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authAPI } from '../services/api';

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(localStorage.getItem('token') || null);
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

  // Getters
  const isAuthenticated = computed(() => !!token.value);

  // Actions
  const setAuth = (authData) => {
    token.value = authData.token;
    user.value = authData.user;
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
  };

  const clearAuth = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const register = async (email, password) => {
    try {
      const data = await authAPI.register(email, password);
      setAuth(data);
      return { success: true, data };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      return { success: false, error: message };
    }
  };

  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      setAuth(data);
      return { success: true, data };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    clearAuth();
  };

  return {
    token,
    user,
    isAuthenticated,
    register,
    login,
    logout
  };
});
