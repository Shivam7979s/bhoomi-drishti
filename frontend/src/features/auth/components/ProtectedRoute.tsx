import { Fragment, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

/**
 * Guards authenticated views and strictly enforces Role-Based Access Control (RBAC).
 *
 * - Unauthenticated visitors are redirected to `/login` with a `next` redirect parameter.
 * - Authenticated users attempting to visit any page they are not permitted to access are
 *   immediately redirected away to `/dashboard`, ensuring restricted pages NEVER show to unauthorized users.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, loading, activeRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-1 items-center justify-center py-20 text-sm text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <span>Verifying sovereign credentials…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  // If user is not authorized to access this page, do not show it to them — redirect to authorized dashboard
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(activeRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Fragment>{children}</Fragment>;
}
