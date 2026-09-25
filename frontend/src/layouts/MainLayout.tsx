import { Outlet } from 'react-router-dom';
import { PublicHeader } from '../components/public/PublicHeader';
import { PublicFooter } from '../components/public/PublicFooter';

/**
 * Global institutional application layout shell.
 * Houses the authoritative brand header, responsive navigation,
 * dynamic route outlet, and institutional public footer.
 */
export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Keyboard-accessible skip link for screen readers and power users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-emerald-800 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:ring-2 focus:ring-white focus:outline-hidden"
      >
        Skip to main content
      </a>

      {/* Sovereign Brand & Public Navigation Header */}
      <PublicHeader />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 flex flex-col w-full scroll-mt-20 focus:outline-hidden" tabIndex={-1}>
        <Outlet />
      </main>

      {/* Institutional Public Footer */}
      <PublicFooter />
    </div>
  );
}
