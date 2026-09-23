import { getJson, postJson } from '../../../services/apiClient';
import { apiBaseUrl } from '../../../utils/env';
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../types/auth';

/** Backend routes of the Phase 2 authentication API. */
const AUTH_ROUTES = {
  register: '/api/auth/register',
  login: '/api/auth/login',
  me: '/api/auth/me',
  logout: '/api/auth/logout',
} as const;

/** Registration/login do BCrypt work plus a database round trip - allow a little more time. */
const AUTH_TIMEOUT_MS = 8000;

export function register(request: RegisterRequest): Promise<AuthResponse> {
  return postJson<AuthResponse>(AUTH_ROUTES.register, request, AUTH_TIMEOUT_MS);
}

export function login(request: LoginRequest): Promise<AuthResponse> {
  return postJson<AuthResponse>(AUTH_ROUTES.login, request, AUTH_TIMEOUT_MS);
}

/** Returns the signed-in user, or throws an `ApiError` with status 401 when there is no session. */
export function fetchCurrentUser(): Promise<AuthUser> {
  return getJson<AuthUser>(AUTH_ROUTES.me);
}

export function logout(): Promise<{ message: string }> {
  return postJson<{ message: string }>(AUTH_ROUTES.logout, {}, AUTH_TIMEOUT_MS);
}

/**
 * Spring Security's OAuth2 authorization endpoint. The browser navigates here directly; the
 * backend completes the Google handshake, sets the session cookie and redirects to
 * `/auth/callback`. The JWT is never placed in a URL.
 */
export const GOOGLE_LOGIN_URL = `${apiBaseUrl}/oauth2/authorization/google`;
