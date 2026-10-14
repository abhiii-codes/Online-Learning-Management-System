import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoUser: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const u = await api.getCurrentUser();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const u = await api.login(email, pass);
    setUser(u);
  };

  const register = async (name: string, email: string, pass: string) => {
    const u = await api.register(name, email, pass);
    setUser(u);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Server logout notice:', err);
    } finally {
      setUser(null);
    }
  };

  const switchDemoUser = async (email: string) => {
    await api.login(email, 'password123');
    await refreshUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, switchDemoUser, refreshUser }}>
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
