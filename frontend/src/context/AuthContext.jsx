import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api } from '../api/client';

const TOKEN_KEY = 'inventory_token';
const ADMIN_KEY = 'inventory_admin';

const AuthContext = createContext(null);

function loadStoredAuth() {
  const token = localStorage.getItem(TOKEN_KEY);
  const adminRaw = localStorage.getItem(ADMIN_KEY);
  if (!token || !adminRaw) return { token: null, admin: null };
  try {
    return { token, admin: JSON.parse(adminRaw) };
  } catch {
    return { token: null, admin: null };
  }
}

export function AuthProvider({ children }) {
  const stored = loadStoredAuth();
  const [token, setToken] = useState(stored.token);
  const [admin, setAdmin] = useState(stored.admin);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      const { access_token, admin: adminData } = res.data;
      localStorage.setItem(TOKEN_KEY, access_token);
      localStorage.setItem(ADMIN_KEY, JSON.stringify(adminData));
      setToken(access_token);
      setAdmin(adminData);
      return adminData;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    setToken(null);
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      admin,
      isAuthenticated: Boolean(token),
      loading,
      login,
      logout,
    }),
    [token, admin, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}
