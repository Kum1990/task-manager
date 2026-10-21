import { apiRequest } from './apiClient.js';

export const listTasks = (status) =>
  apiRequest(status ? `/tasks?status=${encodeURIComponent(status)}` : '/tasks');

export const createTask = (task) => apiRequest('/tasks', { method: 'POST', body: task });

export const updateTask = (id, changes) =>
  apiRequest(`/tasks/${id}`, { method: 'PATCH', body: changes });

export const deleteTask = (id) => apiRequest(`/tasks/${id}`, { method: 'DELETE' });
