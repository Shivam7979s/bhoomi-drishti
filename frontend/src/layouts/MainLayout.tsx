import { BookOpen, Bookmark, Bot, FolderKanban, Landmark, LogIn, LogOut, Map, MapPinned, Scale, Sparkles, UserRound } from 'lucide-react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';

/** Header / content / footer shell shared by every page. */
export function MainLayout() {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <MapPinned className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-[0.2em] text-slate-900">
                BHOOMI-DRISHTI
              </span>
              <span className="block text-xs text-slate-500">AI-Powered Land Governance Platform</span>
            </span>
          </Link>

          <nav className="ml-auto flex items-center gap-2" aria-label="Account">
            {loading ? null : isAuthenticated && user ? (
              <>
                <Link
                  to="/governance"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Landmark className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  Governance
                </Link>
                <Link
                  to="/gis"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Map className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  GIS Map
                </Link>
                <Link
                  to="/land-records"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <MapPinned className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  Land Records
                </Link>
                <Link
                  to="/research"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <BookOpen className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  Research Hub
                </Link>
                <Link
                  to="/assistant"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Bot className="h-4 w-4 text-teal-600" aria-hidden="true" />
                  Assistant
                </Link>
                <Link
                  to="/knowledge"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Sparkles className="h-4 w-4 text-teal-600" aria-hidden="true" />
                  Knowledge
                </Link>
                <Link
                  to="/workspaces"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <FolderKanban className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                  Workspaces
                </Link>
                <Link
                  to="/saved-research"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Bookmark className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  Saved
                </Link>
                <Link
                  to="/scenarios/compare"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Scale className="h-4 w-4 text-purple-600" aria-hidden="true" />
                  Compare
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  {user.name}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/governance"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Landmark className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  Governance
                </Link>
                <Link
                  to="/gis"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Map className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  GIS Map
                </Link>
                <Link
                  to="/research"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <BookOpen className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  Research Hub
                </Link>
                <Link
                  to="/assistant"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Bot className="h-4 w-4 text-teal-600" aria-hidden="true" />
                  Assistant
                </Link>
                <Link
                  to="/knowledge"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Sparkles className="h-4 w-4 text-teal-600" aria-hidden="true" />
                  Knowledge
                </Link>
                <Link
                  to="/workspaces"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <FolderKanban className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                  Workspaces
                </Link>
                <Link
                  to="/scenarios/compare"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Scale className="h-4 w-4 text-purple-600" aria-hidden="true" />
                  Compare
                </Link>
                <Link
                  to="/login"
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4">
        <p className="mx-auto w-full max-w-5xl px-6 text-xs text-slate-500">
          Smart India Hackathon prototype &middot; Phase 2 authentication &middot; Not an official government service
        </p>
      </footer>
    </div>
  );
}


