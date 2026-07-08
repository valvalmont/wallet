import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });

  const clearAuth = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener('auth:logout', clearAuth);
    return () => window.removeEventListener('auth:logout', clearAuth);
  }, [clearAuth]);

  const saveUser = useCallback((userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', token);
    setUser(userData);
  }, []);

  const register = useCallback(async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    // Only save session for Private client (returns accessToken)
    if (data.accessToken && data.user) {
      saveUser(data.user, data.accessToken);
    }
    return data;
  }, [saveUser]);

  const login = useCallback(async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password });
    saveUser(data.user, data.accessToken);
    return data;
  }, [saveUser]);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {});
    clearAuth();
  }, [clearAuth]);

  // ── Change password
  // After a successful change the backend clears the refresh cookie,
  // so we clear the local session too and force the user to log in again.
  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    const { data } = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    // Session is now invalid on the server — clear client state
    clearAuth();
    return data; // { success: true, message: '...' }
  }, [clearAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        changePassword,
        saveUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};