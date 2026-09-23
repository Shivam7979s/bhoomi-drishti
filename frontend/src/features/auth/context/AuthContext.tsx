import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError } from '../../../services/apiClient';
import * as authService from '../services/authService';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types/auth';

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True until the initial `GET /api/auth/me` session check has finished. */
  loading: boolean;
  login(request: LoginRequest): Promise<void>;
  register(request: RegisterRequest): Promise<void>;
  logout(): Promise<void>;
  /** Sends the browser to the backend's Google authorization endpoint. */
  loginWithGoogle(): void;
  /** Re-reads `/api/auth/me` (used on mount and after the Google redirect). */
  refreshUser(): Promise<AuthUser | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Single source of truth for authentication state. The session lives in an HttpOnly cookie the
 * browser holds; this provider only mirrors *who* is signed in by asking the backend.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const me = await authService.fetchCurrentUser();
      setUser(me);
      return me;
    } catch (cause) {
      // 401 just means "no valid session" - expected, not an error to surface.
      if (cause instanceof ApiError && (cause.status === 401 || cause.status === 403)) {
        setUser(null);
        return null;
      }
      throw cause;
    }
  }, []);

  useEffect(() => {
    let active = true;
    refreshUser()
      // Backend unreachable: treat as signed out instead of crashing the app.
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshUser]);

  const login = useCallback(async (request: LoginRequest) => {
    const response = await authService.login(request);
    setUser(response.user);
  }, []);

  const register = useCallback(async (request: RegisterRequest) => {
    const response = await authService.register(request);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // Even when the request fails, drop local state so the UI cannot stay signed in.
      setUser(null);
    }
  }, []);

  const loginWithGoogle = useCallback(() => {
    window.location.assign(authService.GOOGLE_LOGIN_URL);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      loading,
      login,
      register,
      logout,
      loginWithGoogle,
      refreshUser,
    }),
    [user, loading, login, register, logout, loginWithGoogle, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
