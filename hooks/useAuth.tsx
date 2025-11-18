import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { User } from '../types';
import * as api from '../services/mockApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (googleToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('sessionToken'));
  const [loading, setLoading] = useState<boolean>(true);

  const verifyToken = useCallback(async () => {
    const currentToken = localStorage.getItem('sessionToken');
    if (currentToken) {
      try {
        const currentUser = await api.getMe();
        setUser(currentUser);
        setToken(currentToken);
      } catch (error) {
        console.error("Session invalid, logging out", error);
        setToken(null);
        localStorage.removeItem('sessionToken');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const login = async (googleToken: string) => {
    setLoading(true);
    try {
        const { token: sessionToken, user: loggedInUser } = await api.loginWithGoogle(googleToken);
        localStorage.setItem('sessionToken', sessionToken);
        setToken(sessionToken);
        setUser(loggedInUser);
    } catch(error) {
        console.error("Login failed", error);
    } finally {
        setLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setToken(null);
  };

  const value = { user, token, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};