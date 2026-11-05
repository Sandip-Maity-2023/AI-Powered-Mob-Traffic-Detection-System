import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export interface AuthUser {
  id: string;
  username: string;
  full_name: string;
  role: string;
  department: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalNotice: string | null;
  openAuthModal: (notice?: string, onAuthenticated?: () => void) => void;
  closeAuthModal: () => void;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, fullName?: string, role?: string, department?: string) => Promise<boolean>;
  demoLogin: () => Promise<boolean>;
  logout: () => void;
  requireAuth: (callback: () => void, notice?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sentracity_jwt_token'));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalNotice, setAuthModalNotice] = useState<string | null>(null);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  // Validate stored JWT on initial load
  useEffect(() => {
    if (token) {
      validateToken(token);
    }
  }, [token]);

  const validateToken = async (jwtToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        // Token expired
        logout();
      }
    } catch {
      // Backend offline or unreachable: keep cached user session if exists
    }
  };

  const openAuthModal = (notice?: string, onAuthenticated?: () => void) => {
    setAuthModalNotice(notice || 'JSON Web Token (JWT) authentication required for this action.');
    if (onAuthenticated) {
      setPendingCallback(() => onAuthenticated);
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthModalNotice(null);
    setPendingCallback(null);
  };

  const handleAuthSuccess = (jwtToken: string, userData: AuthUser) => {
    localStorage.setItem('sentracity_jwt_token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
    setIsAuthModalOpen(false);
    setAuthModalNotice(null);

    // Execute pending action if any
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Login failed');
      }
      const data = await res.json();
      handleAuthSuccess(data.access_token, data.user);
      return true;
    } catch (e: any) {
      alert(e.message || 'Login credentials incorrect.');
      return false;
    }
  };

  const register = async (
    username: string, 
    password: string, 
    fullName: string = 'Tactical Operator',
    role: string = 'Field Dispatcher',
    department: string = 'Smart City Authorities'
  ): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          full_name: fullName,
          role,
          department
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Registration failed');
      }
      const data = await res.json();
      handleAuthSuccess(data.access_token, data.user);
      return true;
    } catch (e: any) {
      alert(e.message || 'Registration failed.');
      return false;
    }
  };

  const demoLogin = async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/demo-login`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Demo login failed');
      const data = await res.json();
      handleAuthSuccess(data.access_token, data.user);
      return true;
    } catch {
      // Local fallback token simulation if backend is booting
      const dummyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';
      handleAuthSuccess(dummyToken, {
        id: 'USR-DEMO-01',
        username: 'ahamed',
        full_name: 'Officer Ahamed',
        role: 'Tactical Dispatcher',
        department: 'Smart City Command'
      });
      return true;
    }
  };

  const logout = () => {
    localStorage.removeItem('sentracity_jwt_token');
    setToken(null);
    setUser(null);
  };

  const requireAuth = (callback: () => void, notice?: string) => {
    if (user && token) {
      callback();
    } else {
      openAuthModal(notice, callback);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isAuthModalOpen,
        authModalNotice,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        demoLogin,
        logout,
        requireAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

