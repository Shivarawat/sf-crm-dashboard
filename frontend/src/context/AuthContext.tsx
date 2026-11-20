import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/api';

interface AuthUser {
  userId: string;
  instanceUrl: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => void;
}

// Global auth state — any component can call useAuth() to get current user without prop drilling
const AuthContext = createContext<AuthContextType>({ user: null, loading: true, logout: () => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On app load, call /auth/me to check if the session is still valid.
  // If backend returns user data → logged in. If 401 → not logged in, show Login page.
  // If any API call comes back 401 (session expired), drop the user so the Login page shows
  useEffect(() => {
    const id = api.interceptors.response.use(undefined, (err) => {
      if (err.response?.status === 401) setUser(null);
      return Promise.reject(err);
    });
    return () => api.interceptors.response.eject(id);
  }, []);

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Calls /auth/logout on backend to destroy the session, then clears local user state
  const logout = async () => {
    await api.get('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — components import useAuth() instead of useContext(AuthContext) directly
export const useAuth = () => useContext(AuthContext);
