import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Landing page of the Google redirect.
 *
 * The backend does **not** put the JWT in this URL - it only sets the HttpOnly session cookie and
 * redirects here (optionally with a safe `?error=` code). This page then asks the backend who is
 * signed in and continues into the app.
 */
export function AuthCallbackPage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorCode = params.get('error');
    if (errorCode) {
      navigate(`/login?error=${encodeURIComponent(errorCode)}`, { replace: true });
      return;
    }

    const token = params.get('token');
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('bhoomi_token', token);
      // Clean query string from browser address bar immediately
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {
        // ignore history state issues in restrictive environments
      }
    }

    let active = true;
    refreshUser()
      .then((user) => {
        if (!active) return;
        navigate(user ? '/dashboard' : '/login?error=login_failed', { replace: true });
      })
      .catch(() => {
        if (active) navigate('/login?error=login_failed', { replace: true });
      });

    return () => {
      active = false;
    };
  }, [location.search, navigate, refreshUser]);

  return (
    <div className="flex flex-1 items-center justify-center py-20 text-sm text-slate-500">
      Completing sign-in...
    </div>
  );
}
