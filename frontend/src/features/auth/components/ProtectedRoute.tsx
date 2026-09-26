import { Fragment, type ReactNode } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, RefreshCw, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

const ROLE_LABELS: Record<Role, string> = {
  PUBLIC: 'Public Citizen',
  RESEARCHER: 'Policy Researcher',
  ACADEMIA: 'Academic Scholar',
  GOVERNMENT_OFFICIAL: 'Government Official',
  ADMIN: 'System Administrator',
};

/**
 * Guards authenticated views and enforces Role-Based Access Control (RBAC).
 *
 * - Unauthenticated visitors are redirected to `/login` with a `next` redirect parameter.
 * - Authenticated users lacking the required clearance receive a sovereign 403 Access Denied screen
 *   with an interactive demo switch option for evaluators.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, loading, activeRole, switchRole } = useAuth();
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

  // Check role authorization
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(activeRole)) {
    const requiredLabels = allowedRoles.map((r) => ROLE_LABELS[r] || r).join(' or ');
    const primaryAllowed = allowedRoles[0];

    return (
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="max-w-xl w-full rounded-2xl border border-rose-200 bg-white p-8 shadow-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-5 border border-rose-100 shadow-xs">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/70 text-rose-800 text-xs font-bold uppercase tracking-wider mb-3">
            <Lock className="h-3 w-3" />
            <span>Restricted Clearance &bull; 403 Forbidden</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Restricted Module Access
          </h1>

          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            This land governance module requires <strong>{requiredLabels}</strong> clearance under sovereign data
            protection guidelines. Your active credential profile is currently:{' '}
            <span className="font-bold text-slate-800 underline decoration-rose-300">
              {ROLE_LABELS[activeRole] || activeRole}
            </span>.
          </p>

          <div className="mt-6 rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-xs text-slate-500 text-left">
            <span className="font-bold text-slate-700 block mb-1">DILRMP & DPDP Act 2023 Compliance Note:</span>
            Non-official public users are restricted from direct workspace collaboration, administrative indicators,
            and unmasked title deed mutations to protect citizen privacy.
          </div>

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Citizen Home</span>
            </Link>

            {/* Quick Demo Switcher Button for Judges & Evaluators */}
            <button
              type="button"
              onClick={() => switchRole(primaryAllowed)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 text-xs sm:text-sm font-bold text-white hover:bg-emerald-800 shadow-sm transition cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Switch to {ROLE_LABELS[primaryAllowed]} (Demo)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Fragment>{children}</Fragment>;
}
