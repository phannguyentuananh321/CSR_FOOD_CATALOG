import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  activateApi,
  loginApi,
  logoutApi,
  refreshApi,
  registerApi,
  resendOtpApi,
} from '../api/auth';
import { setAccessToken, setOnAuthFailure } from '../api/client';
import type { AuthResponse, User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (credentials: { email: string; password: string; recaptchaToken?: string }) => Promise<AuthResponse>;
  register: (payload: { email: string; password: string; displayName?: string; recaptchaToken?: string }) => Promise<{ message: string; email: string; requiresActivation: boolean }>;
  activate: (payload: { email: string; otp: string }) => Promise<AuthResponse>;
  resendOtp: (email: string) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessTokenState, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const applyAuth = (token: string, userData: User) => {
    setAccessToken(token);
    setAccessTokenState(token);
    setUser(userData);
  };

  const clearAuth = () => {
    setAccessToken(null);
    setAccessTokenState(null);
    setUser(null);
  };

  // Silent refresh on app load to restore session from httpOnly cookie
  useEffect(() => {
    let isMounted = true;

    setOnAuthFailure(() => {
      if (isMounted) clearAuth();
    });

    async function initSession() {
      try {
        const res = await refreshApi();
        if (isMounted && res.accessToken && res.user) {
          applyAuth(res.accessToken, res.user);
        }
      } catch {
        if (isMounted) clearAuth();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();

    return () => {
      isMounted = false;
      setOnAuthFailure(null);
    };
  }, []);

  const login = async (credentials: { email: string; password: string; recaptchaToken?: string }) => {
    const res = await loginApi(credentials);
    applyAuth(res.accessToken, res.user);
    return res;
  };

  const register = async (payload: { email: string; password: string; displayName?: string; recaptchaToken?: string }) => {
    return registerApi(payload);
  };

  const activate = async (payload: { email: string; otp: string }) => {
    const res = await activateApi(payload);
    applyAuth(res.accessToken, res.user);
    return res;
  };

  const resendOtp = async (email: string) => {
    return resendOtpApi(email);
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    } finally {
      clearAuth();
    }
  };

  const refresh = async (): Promise<boolean> => {
    try {
      const res = await refreshApi();
      if (res.accessToken && res.user) {
        applyAuth(res.accessToken, res.user);
        return true;
      }
      clearAuth();
      return false;
    } catch {
      clearAuth();
      return false;
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: accessTokenState,
        isLoading,
        isAdmin,
        login,
        register,
        activate,
        resendOtp,
        logout,
        refresh,
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
