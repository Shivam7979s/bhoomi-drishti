import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Bot,
  ChevronDown,
  FolderKanban,
  Landmark,
  LogIn,
  LogOut,
  Map,
  MapPinned,
  Menu,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { BrandLogo } from './BrandLogo';
import { MobileNavigation } from './MobileNavigation';

const NAV_ITEMS = [
  { to: '/governance', label: 'Governance', icon: Landmark },
  { to: '/gis', label: 'GIS Map', icon: Map },
  { to: '/research', label: 'Research Hub', icon: null },
  { to: '/assistant', label: 'AI Assistant', icon: Bot, isAi: true },
];

export function PublicHeader() {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);

  async function handleLogout() {
    setIsUserMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  }

  // Close user dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isUserMenuOpen) {
        setIsUserMenuOpen(false);
        userButtonRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xs transition-shadow duration-200 shadow-2xs">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand Identity & Crest */}
          <div className="flex items-center gap-3 shrink-0">
            <BrandLogo size="md" />
          </div>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden lg:flex items-center gap-1 xl:gap-2"
            aria-label="Primary Platform Navigation"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-900 shadow-2xs ring-1 ring-emerald-600/20'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  {Icon && <Icon className="h-4 w-4 text-emerald-700" aria-hidden="true" />}
                  <span>{item.label}</span>
                  {item.isAi && (
                    <span className="ml-0.5 rounded-full bg-teal-100 px-1.5 py-0.2 text-[10px] font-bold text-teal-800 tracking-wide">
                      AI
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Utility & Authentication Section */}
          <div className="hidden lg:flex items-center gap-3">
            {loading ? null : isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                {/* Quick Workspace Navigation */}
                <Link
                  to="/workspaces"
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700"
                  title="Collaborative Workspaces"
                >
                  <FolderKanban className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                  <span className="hidden xl:inline">Workspaces</span>
                </Link>

                {/* Saved Research Bookmarks */}
                <Link
                  to="/saved-research"
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700"
                  title="Saved Research"
                >
                  <Bookmark className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  <span className="hidden xl:inline">Saved</span>
                </Link>

                <div className="h-4 w-px bg-slate-200 mx-1" aria-hidden="true" />

                {/* User Dropdown Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    ref={userButtonRef}
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="menu"
                    aria-label="User account menu"
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="max-w-[120px] truncate text-slate-900">{user.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  </button>

                  {/* Dropdown Card */}
                  {isUserMenuOpen && (
                    <div
                      role="menu"
                      aria-label="User options"
                      className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg text-xs z-50 animate-in fade-in zoom-in-95 duration-100 motion-reduce:transition-none"
                    >
                      <div className="border-b border-slate-100 px-3 py-2">
                        <p className="font-bold text-slate-900 truncate max-w-[200px]">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{user.email}</p>
                        <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 uppercase">
                          {user.role.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 transition focus:outline-hidden focus-visible:bg-slate-100"
                        >
                          <UserRound className="h-4 w-4 text-slate-500" />
                          <span>Account Profile</span>
                        </Link>

                        <Link
                          to="/land-records"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 transition focus:outline-hidden focus-visible:bg-slate-100"
                        >
                          <MapPinned className="h-4 w-4 text-emerald-600" />
                          <span>Land Records Registry</span>
                        </Link>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-rose-700 hover:bg-rose-50 transition font-medium focus:outline-hidden focus-visible:bg-rose-50"
                        >
                          <LogOut className="h-4 w-4 text-rose-600" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 transition active:scale-98"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Navigation Trigger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              aria-expanded={isMobileOpen}
              aria-controls="mobile-nav"
              aria-label="Open main navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Accessible Mobile Slide-Out Drawer */}
      <MobileNavigation
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        isAuthenticated={Boolean(isAuthenticated)}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
}
