/** Roles used by the platform (mirrors the backend `Role` enum). */
export type Role = 'ADMIN' | 'GOVERNMENT_OFFICIAL' | 'RESEARCHER' | 'ACADEMIA' | 'PUBLIC';

/** Where the account came from (mirrors the backend `AuthProvider` enum). */
export type AuthProvider = 'LOCAL' | 'GOOGLE';

/**
 * Safe subset of the backend user entity. Password, hash, googleId and timestamps are
 * deliberately absent - the backend never returns them.
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  provider: AuthProvider;
  profileImageUrl: string | null;
}

/** Success body of POST /api/auth/register and POST /api/auth/login. */
export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: AuthUser;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
