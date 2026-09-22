import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm font-semibold tracking-widest text-emerald-600">404</p>
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="max-w-md text-sm text-slate-500">
        The page you requested does not exist yet. Only the Phase 1 shell is available in this version.
      </p>
      <Link
        to="/"
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
        Back to home
      </Link>
    </div>
  );
}
