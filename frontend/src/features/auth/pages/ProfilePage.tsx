import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, User } from 'lucide-react';
import { AppContainer } from '../../../components/layout/AppContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
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
    <AppContainer>
      <PageHeader
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Account Profile' },
        ]}
        badge={{
          text: 'Verified Session',
          icon: User,
          variant: 'emerald',
        }}
        title="Institutional Account"
        description="Review your active credentials, assigned platform roles, and authorization boundary on BHOOMI-DRISHTI."
        actions={
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <span>{loggingOut ? 'Signing out...' : 'Sign out'}</span>
          </button>
        }
      />

      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-lg">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{user.name}</h2>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
            <div className="flex justify-between py-3.5">
              <dt className="font-semibold text-slate-500">Full Name</dt>
              <dd className="font-medium text-slate-900">{user.name}</dd>
            </div>
            <div className="flex justify-between py-3.5">
              <dt className="font-semibold text-slate-500">Email Address</dt>
              <dd className="font-medium text-slate-900">{user.email}</dd>
            </div>
            <div className="flex justify-between py-3.5">
              <dt className="font-semibold text-slate-500">Platform Role</dt>
              <dd>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-900 uppercase">
                  <Shield className="h-3 w-3 text-emerald-700" aria-hidden="true" />
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </dd>
            </div>
            <div className="flex justify-between py-3.5">
              <dt className="font-semibold text-slate-500">Signed in via</dt>
              <dd className="text-slate-900 font-medium">
                {user.provider === 'GOOGLE' ? 'Google SSO' : 'Email and Password'}
              </dd>
            </div>
            <div className="flex justify-between py-3.5">
              <dt className="font-semibold text-slate-500">Account ID</dt>
              <dd className="font-mono text-xs text-slate-600">{user.id}</dd>
            </div>
          </dl>

          <p className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-500 leading-relaxed">
            Your session is stored securely in an HttpOnly cookie — client-side scripts never see or access the underlying token.
          </p>
        </div>
      </div>
    </AppContainer>
  );
}
