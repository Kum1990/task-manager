import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContext.js';
import { tokenStore } from '../services/apiClient.js';
import * as authService from '../services/authService.js';
import logger from '../utils/logger.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));

  // Restore the session from a saved token when the page loads.
  useEffect(() => {
    if (!tokenStore.get()) return;
    authService
      .getCurrentUser()
      .then(({ user: current }) => setUser(current))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const handleAuthResponse = useCallback(({ user: authedUser, token }) => {
    tokenStore.set(token);
    setUser(authedUser);
    logger.info('User signed in', { userId: authedUser.id });
  }, []);

  const login = useCallback(
    async (credentials) => handleAuthResponse(await authService.login(credentials)),
    [handleAuthResponse],
  );

  const register = useCallback(
    async (payload) => handleAuthResponse(await authService.register(payload)),
    [handleAuthResponse],
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    logger.info('User signed out');
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
