import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthenticatedHeader } from '../features/dashboard/components/AuthenticatedHeader';
import { AuthenticatedSidebar } from '../features/dashboard/components/AuthenticatedSidebar';

/**
 * Authenticated Layout shell inspired directly by DigiLocker's authenticated dashboard portal.
 * Features a top sovereign banner, fixed left navigation sidebar, and dynamic main canvas.
 */
export function AuthenticatedLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Sovereign App Header */}
      <AuthenticatedHeader
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        isMobileSidebarOpen={mobileSidebarOpen}
      />

      {/* Main App Body with Sidebar + Content */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Left Navigation Sidebar (Comfortable width) */}
        <AuthenticatedSidebar
          isMobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Dynamic Route Content Canvas */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 xl:p-9 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
