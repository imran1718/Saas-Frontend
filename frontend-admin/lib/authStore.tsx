'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { apiClient } from './apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'platform_access_token';
const USER_STORAGE_KEY = 'platform_user';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Track if we're mid-refresh to avoid duplicate calls on StrictMode double-mount
  const refreshInProgress = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      if (refreshInProgress.current) return;
      refreshInProgress.current = true;

      try {
        // 1. Try to restore from localStorage first (survives hot reload)
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);

        if (storedToken && storedUser) {
          // Set the token immediately so UI doesn't flash to login
          const parsedUser = JSON.parse(storedUser) as User;
          setUser(parsedUser);
          setAccessToken(storedToken);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

          // Silently validate token with /me — if it fails the interceptor will refresh
          try {
            const meRes = await apiClient.get('/platform/auth/me');
            if (meRes.data.success) {
              setUser(meRes.data.data);
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(meRes.data.data));
            }
          } catch {
            // Token expired — try refresh
            await doRefresh();
          }
        } else {
          // 2. No local storage — call refresh endpoint (uses httpOnly cookie)
          await doRefresh();
        }
      } catch {
        // Not logged in
        clearLocalStorage();
      } finally {
        setIsLoading(false);
        refreshInProgress.current = false;
      }
    };

    initAuth();
  }, []);

  const doRefresh = async () => {
    try {
      const { data } = await apiClient.post('/platform/auth/refresh');
      if (data.success && data.data.access_token) {
        const token = data.data.access_token;
        const adminUser = data.data.admin;

        setAccessToken(token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem(TOKEN_STORAGE_KEY, token);

        if (adminUser) {
          setUser(adminUser);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminUser));
        } else {
          // Fetch user profile separately
          const meRes = await apiClient.get('/platform/auth/me');
          if (meRes.data.success) {
            setUser(meRes.data.data);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(meRes.data.data));
          }
        }
      }
    } catch {
      clearLocalStorage();
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  const setAuth = (newUser: User, token: string) => {
    setUser(newUser);
    setAccessToken(token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // Persist to localStorage so hot reload / page refresh doesn't lose session
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      await apiClient.post('/platform/auth/logout');
    } catch {
      // ignore
    } finally {
      setUser(null);
      setAccessToken(null);
      delete apiClient.defaults.headers.common['Authorization'];
      clearLocalStorage();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, setAuth, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
