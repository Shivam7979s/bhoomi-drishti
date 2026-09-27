import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { ApiError } from '../../../services/apiClient';
import * as authService from '../services/authService';
import type { AuthUser, LoginRequest, RegisterRequest, Role } from '../types/auth';

export interface AuthContextValue {
  user: AuthUser | null;
  /** Active role strictly derived from real authenticated database user session. */
  activeRole: Role;
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
 * Single source of truth for authentication state.
 * The session lives in an HttpOnly cookie or token; this provider strictly reflects
 * the user's authentic database role without client-side spoofing.
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

  const login = useCallback(
    async (request: LoginRequest) => {
      const response = await authService.login(request);
      setUser(response.user);
    },
    [],
  );

  const register = useCallback(
    async (request: RegisterRequest) => {
      const response = await authService.register(request);
      setUser(response.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const loginWithGoogle = useCallback(() => {
    window.location.assign(authService.GOOGLE_LOGIN_URL);
  }, []);

  // Strict role from database, defaulting to PUBLIC if unauthenticated
  const activeRole: Role = user?.role || 'PUBLIC';

  return (
    <AuthContext.Provider
      value={{
        user,
        activeRole,
        isAuthenticated: user !== null,
        loading,
        login,
        register,
        logout,
        loginWithGoogle,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
