import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(api.getToken());
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const fetchCurrentUser = useCallback(async () => {
    const currentToken = api.getToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.get('/auth/me');
      setUser(userData);
    } catch (err) {
      console.error('Failed to restore user session:', err);
      api.setToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      api.setToken(response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      toast.success(`Welcome back, ${response.user.name}!`);
      return response.user;
    } catch (err) {
      toast.error(err.message || 'Login failed. Please verify credentials.');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      api.setToken(response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      toast.success(`Welcome to FitTrack, ${response.user.name}!`);
      return response.user;
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
      throw err;
    }
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
    toast.info('You have been logged out.');
  };

  const refreshUser = async () => {
    try {
      const userData = await api.get('/auth/me');
      setUser(userData);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
