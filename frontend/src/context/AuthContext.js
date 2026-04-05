import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in (token in localStorage)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        console.log('AuthContext: Token found:', !!token);
        
        if (token) {
          // Verify token is still valid with a timeout
          try {
            console.log('AuthContext: Verifying token...');
            const response = await Promise.race([
              api.get('/auth/profile'),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Token verification timeout')), 8000)
              ),
            ]);
            console.log('AuthContext: Token verified, user:', response.data.username);
            setUser(response.data);
          } catch (err) {
            console.error('AuthContext: Token verification failed:', err.message);
            // Token is invalid or expired
            localStorage.removeItem('authToken');
            setUser(null);
          }
        } else {
          console.log('AuthContext: No token found, user is not authenticated');
          setUser(null);
        }
      } catch (err) {
        console.error('AuthContext: Initialization error:', err);
        setUser(null);
      } finally {
        console.log('AuthContext: Loading complete');
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    setError(null);
    try {
      console.log('AuthContext: Login attempt for:', username);
      const response = await api.post('/auth/login', { username, password });
      const { user: userData, token } = response.data;

      localStorage.setItem('authToken', token);
      setUser(userData);
      console.log('AuthContext: Login successful for:', userData.username);
      return userData;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Login failed';
      console.error('AuthContext: Login failed:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  const register = async (full_name, username, email, password, role = 'viewer') => {
    setError(null);
    try {
      const response = await api.post('/auth/register', {
        full_name,
        username,
        email,
        password,
        role,
      });
      const { user: userData, token } = response.data;

      localStorage.setItem('authToken', token);
      setUser(userData);
      return userData;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed';
      setError(errorMessage);
      throw err;
    }
  };

  const logout = () => {
    console.log('AuthContext: Logging out');
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return true;
    } catch (err) {
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    changePassword,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
