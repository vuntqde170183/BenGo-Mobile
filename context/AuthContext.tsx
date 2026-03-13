import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuthStore } from '@/store';
import { fetchAPI } from '@/lib/fetch';
import { User } from '@/types/type';

interface AuthContextType {
  login: (account: string, password: string) => Promise<User | null>;
  logout: () => void;
  user: User | null;
  token: string | null;
  hasHydrated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { setAuth, logout: clearAuth, user, token, hasHydrated } = useAuthStore();

  const login = async (account: string, password: string) => {
    try {
      const isEmail = account.includes('@');
      const payload = {
        [isEmail ? 'email' : 'phone']: account,
        password,
      };
      const response = await fetchAPI('/(api)/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const loginData = response.data;

      if (loginData && loginData.accessToken && loginData.user) {
        setAuth(loginData.accessToken, loginData.user);
        return loginData.user;
      } else {
        console.error('[AuthContext] Login failed: Invalid response format', response);
        throw new Error('Phản hồi đăng nhập không hợp lệ');
      }
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error.message || error);
      throw error;
    }
  };

  const logout = () => {
    clearAuth();
  };

  return (
    <AuthContext.Provider value={{ login, logout, user, token, hasHydrated }}>
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
