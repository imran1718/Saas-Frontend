'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from './apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: { id: string; name: string };
  tenant_id: string;
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await apiClient.post('/auth/refresh');
        if (data.success && data.data.access_token) {
          setAccessToken(data.data.access_token);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.data.access_token}`;
          
          const meRes = await apiClient.get('/auth/me');
          if (meRes.data.success) {
            setUser(meRes.data.data);
          }
        }
      } catch (error) {
        // Not logged in, that's fine
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const setAuth = (newUser: User, token: string) => {
    setUser(newUser);
    setAccessToken(token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      setAccessToken(null);
      delete apiClient.defaults.headers.common['Authorization'];
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
