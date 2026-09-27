import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthCard, AuthDivider, FormError, FormField, GoogleButton, SubmitButton } from '../components/AuthFormParts';
import { useAuth } from '../hooks/useAuth';
import { messageForError, messageForOauthError } from '../utils/messages';

/**
 * Email/password sign-in plus the "Continue with Google" entry point.
 *
 * `?next=` (set by ProtectedRoute) decides where the user lands after signing in; `?error=`
 * carries the failure code the backend appended to the Google redirect.
 */
export function LoginPage() {
  const { login, loginWithGoogle, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const nextPath = searchParams.get('next') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(() => messageForOauthError(searchParams.get('error')));
  const [submitting, setSubmitting] = useState(false);

  // Already signed in (bookmark /login, or back button after signing in): leave immediately.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(nextPath, { replace: true });
    }
  }, [loading, isAuthenticated, navigate, nextPath]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setFormError('Enter your email address.');
      return;
    }
    if (!password) {
      setFormError('Enter your password.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(nextPath, { replace: true });
    } catch (cause) {
      // Backend messages (401/409/offline) are mapped to safe, human-readable text.
      setFormError(messageForError(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Sign in to BHOOMI-DRISHTI to continue."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link
            to={`/register${location.search}`}
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormError message={formError} />
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <SubmitButton busy={submitting} busyLabel="Signing in...">
          Sign in
        </SubmitButton>
      </form>

      {/* ── Sovereign Demo Personas (Real Database Accounts) ── */}
      <div className="pt-3 border-t border-slate-100">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Demo Personas (1-Click Fill & Authenticate):
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {/* Citizen / Public Persona */}
          <button
            type="button"
            onClick={() => {
              setEmail('citizen@example.com');
              setPassword('Password123');
            }}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-950 font-bold transition text-left cursor-pointer shadow-2xs"
          >
            <span className="text-base">👤</span>
            <div className="min-w-0">
              <div className="font-bold text-emerald-950">Citizen</div>
              <div className="text-[10px] font-medium text-emerald-700 truncate">citizen@...</div>
            </div>
          </button>

          {/* Researcher Persona */}
          <button
            type="button"
            onClick={() => {
              setEmail('researcher1@example.com');
              setPassword('Password123');
            }}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/80 text-purple-950 font-bold transition text-left cursor-pointer shadow-2xs"
          >
            <span className="text-base">🔬</span>
            <div className="min-w-0">
              <div className="font-bold text-purple-950">Researcher</div>
              <div className="text-[10px] font-medium text-purple-700 truncate">researcher1@...</div>
            </div>
          </button>

          {/* Revenue Officer Persona */}
          <button
            type="button"
            onClick={() => {
              setEmail('gov_user@example.com');
              setPassword('Password123');
            }}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 text-blue-950 font-bold transition text-left cursor-pointer shadow-2xs"
          >
            <span className="text-base">🏛️</span>
            <div className="min-w-0">
              <div className="font-bold text-blue-950">Officer</div>
              <div className="text-[10px] font-medium text-blue-700 truncate">gov_user@...</div>
            </div>
          </button>
        </div>
      </div>

      <AuthDivider />
      <GoogleButton onClick={loginWithGoogle} />
    </AuthCard>
  );
}
