import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  GOVERNMENT_OFFICIAL: 'Government Official',
  RESEARCHER: 'Researcher',
  ACADEMIA: 'Academic',
  PUBLIC: 'Public',
};

/**
 * The protected view of Phase 2: proof that a signed-in user can reach content that
 * unauthenticated visitors cannot, and the place where logout is triggered.
 */
export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) {
    // ProtectedRoute guarantees a user; this only guards direct rendering in tests.
    return null;
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your account</h1>
            <p className="mt-1 text-sm text-slate-500">
              You are signed in. This page sits behind a protected route.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {loggingOut ? 'Signing out...' : 'Logout'}
          </button>
        </div>

        <dl className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
          <div className="flex gap-4 py-3">
            <dt className="w-32 shrink-0 text-sm font-medium text-slate-500">Name</dt>
            <dd className="text-sm text-slate-900">{user.name}</dd>
          </div>
          <div className="flex gap-4 py-3">
            <dt className="w-32 shrink-0 text-sm font-medium text-slate-500">Email</dt>
            <dd className="text-sm text-slate-900">{user.email}</dd>
          </div>
          <div className="flex gap-4 py-3">
            <dt className="w-32 shrink-0 text-sm font-medium text-slate-500">Role</dt>
            <dd>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </dd>
          </div>
          <div className="flex gap-4 py-3">
            <dt className="w-32 shrink-0 text-sm font-medium text-slate-500">Signed in via</dt>
            <dd className="text-sm text-slate-900">
              {user.provider === 'GOOGLE' ? 'Google' : 'Email and password'}
            </dd>
          </div>
        </dl>

        <p className="mt-6 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Your session is stored in an HttpOnly cookie - this page never sees the token itself.
        </p>
      </div>
    </div>
  );
}
