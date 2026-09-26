import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError } from '../../../services/apiClient';
import * as authService from '../services/authService';
import type { AuthUser, LoginRequest, RegisterRequest, Role } from '../types/auth';

export interface AuthContextValue {
  user: AuthUser | null;
  /** Active verified role (defaults to account role, can be simulated for evaluation) */
  activeRole: Role;
  /** True if the user is currently testing with a simulated demo role */
  isSimulatedRole: boolean;
  /** Switches the active role for evaluation or resets to real role when passed null */
  switchRole(role: Role | null): void;
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

const DEMO_ROLE_KEY = 'bhoomi_demo_role';

/**
 * Single source of truth for authentication state. The session lives in an HttpOnly cookie the
 * browser holds; this provider mirrors who is signed in and enforces role verification.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoRole, setDemoRole] = useState<Role | null>(() => {
    try {
      const stored = sessionStorage.getItem(DEMO_ROLE_KEY);
      if (stored && ['ADMIN', 'GOVERNMENT_OFFICIAL', 'RESEARCHER', 'ACADEMIA', 'PUBLIC'].includes(stored)) {
        return stored as Role;
      }
    } catch {
      // Ignore storage access errors
    }
    return null;
  });

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
      setUser(null);
      setDemoRole(null);
      sessionStorage.removeItem(DEMO_ROLE_KEY);
    }
  }, []);

  const loginWithGoogle = useCallback(() => {
    window.location.assign(authService.GOOGLE_LOGIN_URL);
  }, []);

  const switchRole = useCallback((role: Role | null) => {
    setDemoRole(role);
    try {
      if (role) {
        sessionStorage.setItem(DEMO_ROLE_KEY, role);
      } else {
        sessionStorage.removeItem(DEMO_ROLE_KEY);
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const activeRole: Role = demoRole || user?.role || 'PUBLIC';
  const isSimulatedRole = demoRole !== null && demoRole !== user?.role;

  const effectiveUser: AuthUser | null = useMemo(() => {
    if (!user) return null;
    return {
      ...user,
      role: activeRole,
    };
  }, [user, activeRole]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: effectiveUser,
      activeRole,
      isSimulatedRole,
      switchRole,
      isAuthenticated: user !== null,
      loading,
      login,
      register,
      logout,
      loginWithGoogle,
      refreshUser,
    }),
    [effectiveUser, activeRole, isSimulatedRole, switchRole, user, loading, login, register, logout, loginWithGoogle, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

