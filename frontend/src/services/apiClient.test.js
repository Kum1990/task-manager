import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest, tokenStore } from './apiClient.js';

function mockResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('apiRequest', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('sends the bearer token and returns parsed JSON', async () => {
    tokenStore.set('abc123');
    fetch.mockResolvedValue(mockResponse(200, { tasks: [] }));

    await expect(apiRequest('/tasks')).resolves.toEqual({ tasks: [] });
    expect(fetch).toHaveBeenCalledWith(
      '/api/tasks',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer abc123' }),
      }),
    );
  });

  it('throws an ApiError with the server message', async () => {
    fetch.mockResolvedValue(mockResponse(401, { error: { message: 'Invalid email or password' } }));

    const promise = apiRequest('/auth/login', { method: 'POST', body: {} });

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password',
    });
  });

  it('returns null for 204 responses', async () => {
    fetch.mockResolvedValue(mockResponse(204));
    await expect(apiRequest('/tasks/1', { method: 'DELETE' })).resolves.toBeNull();
  });
});
