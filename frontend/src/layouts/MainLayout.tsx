import { MapPinned } from 'lucide-react';
import { Outlet } from 'react-router-dom';

/** Header / content / footer shell shared by every page. */
export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-6 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <MapPinned className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold tracking-[0.2em] text-slate-900">BHOOMI-DRISHTI</p>
            <p className="text-xs text-slate-500">AI-Powered Land Governance Platform</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4">
        <p className="mx-auto w-full max-w-5xl px-6 text-xs text-slate-500">
          Smart India Hackathon prototype &middot; Phase 1 project foundation &middot; Not an official government service
        </p>
      </footer>
    </div>
  );
}
