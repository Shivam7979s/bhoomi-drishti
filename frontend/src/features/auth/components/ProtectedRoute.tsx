import { Fragment, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Guards authenticated views:
 *
 * - while the session check runs, a lightweight placeholder is shown (no flash of the login page),
 * - unauthenticated visitors are redirected to `/login` with a `next` parameter so they land back
 *   where they wanted to go after signing in.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-sm text-slate-500">
        Checking your session...
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return <Fragment>{children}</Fragment>;
}
