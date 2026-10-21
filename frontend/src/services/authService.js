import { apiRequest } from './apiClient.js';

export const register = (payload) =>
  apiRequest('/auth/register', { method: 'POST', body: payload });

export const login = (credentials) =>
  apiRequest('/auth/login', { method: 'POST', body: credentials });

export const getCurrentUser = () => apiRequest('/auth/me');
