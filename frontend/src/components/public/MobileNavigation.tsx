import { useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  BookOpen,
  Bookmark,
  Bot,
  Compass,
  FolderKanban,
  Landmark,
  LogIn,
  LogOut,
  Map,
  MapPinned,
  Scale,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import type { AuthUser } from '../../features/auth/types/auth';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  user: AuthUser | null;
  onLogout: () => void;
}

const AUTHENTICATED_NAV_LINKS = [
  { to: '/explore', label: 'Explore Platform', icon: Compass, description: 'Public search, domain & geographic discovery' },
  { to: '/governance', label: 'Governance', icon: Landmark, description: 'District KPI metrics & benchmarks' },
  { to: '/gis', label: 'GIS Map', icon: Map, description: 'Spatial cadastral parcel polygons' },
  { to: '/research', label: 'Research Hub', icon: BookOpen, description: 'Published acts, circulars & research' },
  { to: '/assistant', label: 'AI Assistant', icon: Bot, badge: 'Statutory', description: 'Evidence-grounded statutory Q&A' },
  { to: '/knowledge', label: 'Knowledge Search', icon: Sparkles, description: 'Semantic vector evidence search' },
];

export function MobileNavigation({
  isOpen,
  onClose,
  isAuthenticated,
  user,
  onLogout,
}: MobileNavigationProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocusedElement.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="mobile-nav"
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div
        ref={drawerRef}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col bg-white shadow-2xl border-l border-slate-200 transition-transform duration-300 ease-out"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/brand/bhoomi-drishti-logo-navbar.webp"
              alt=""
              aria-hidden="true"
              width={36}
              height={36}
              className="h-9 w-9 rounded-full border border-blue-900/10 object-cover"
            />
            <span className="text-sm font-black tracking-wider text-slate-900">
              BHOOMI<span className="text-blue-600">-DRISHTI</span>
            </span>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* User Status Bar if Authenticated */}
          {isAuthenticated && user && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-bold text-xs text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">{user.name}</p>
                  <p className="truncate text-[10px] text-slate-500">{user.email}</p>
                </div>
                <span className="rounded-full bg-blue-200/70 px-2 py-0.5 text-[10px] font-semibold text-blue-900 uppercase">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          {isAuthenticated ? (
            /* Logged in user: full platform tools */
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Platform Modules
                </p>
                {AUTHENTICATED_NAV_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? 'bg-blue-50 text-blue-900 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" aria-hidden="true" />
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="rounded-md bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-800">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">{item.description}</p>
                      </div>
                    </NavLink>
                  );
                })}
              </div>

              <div className="space-y-1 border-t border-slate-100 pt-4">
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Workspaces & Records
                </p>
                <NavLink
                  to="/workspaces"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <FolderKanban className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                  <span>Collaboration Workspaces</span>
                </NavLink>

                <NavLink
                  to="/land-records"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <MapPinned className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  <span>Land Records Registry</span>
                </NavLink>

                <NavLink
                  to="/saved-research"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-amber-50 text-amber-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <Bookmark className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  <span>Saved Research</span>
                </NavLink>

                <NavLink
                  to="/scenarios/compare"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-purple-50 text-purple-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <Scale className="h-4 w-4 text-purple-600" aria-hidden="true" />
                  <span>Scenario Comparison</span>
                </NavLink>

                <NavLink
                  to="/profile"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <UserRound className="h-4 w-4 text-slate-600" aria-hidden="true" />
                  <span>Account Profile</span>
                </NavLink>
              </div>
            </div>
          ) : (
            /* Unauthenticated user: ONLY show pages they CAN access! */
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Public Access
                </p>
                <NavLink
                  to="/explore"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-start gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-900'
                        : 'text-slate-800 hover:bg-slate-50 hover:text-blue-700'
                    }`
                  }
                >
                  <Compass className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="block text-sm font-bold">Explore Platform</span>
                    <span className="block text-xs font-normal text-slate-500 mt-0.5">
                      Search published research, land acts, circulars & geospatial overview
                    </span>
                  </div>
                </NavLink>
              </div>

              {/* Sign in invitation card */}
              <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-4 text-left space-y-2">
                <p className="text-xs font-bold text-blue-900">Member Sign In Required</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Sign in or create an account to access Governance Dashboards, Interactive GIS Maps, and AI Statutory Legal Assistant.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              <LogOut className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                onClick={onClose}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>Login / Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
