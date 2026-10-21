import logger from '../utils/logger.js';

const TOKEN_KEY = 'taskmanager.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  const started = performance.now();
  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const durationMs = Math.round(performance.now() - started);
  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error?.message || `Request failed (${response.status})`;
    logger.warn('API request failed', { method, path, status: response.status, durationMs });
    throw new ApiError(response.status, message, data?.error?.details);
  }

  logger.debug('API request', { method, path, status: response.status, durationMs });
  return data;
}
