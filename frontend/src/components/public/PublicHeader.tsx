import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Bot,
  ChevronDown,
  Compass,
  ExternalLink,
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
import { MobileNavigation } from './MobileNavigation';

const AUTHENTICATED_NAV_ITEMS = [
  { to: '/explore', label: 'Explore', icon: Compass },
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
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);

  // Accessible font size adjustment
  const handleFontSizeChange = (size: 'sm' | 'md' | 'lg') => {
    setFontSize(size);
    if (size === 'sm') {
      document.documentElement.style.fontSize = '14.5px';
    } else if (size === 'lg') {
      document.documentElement.style.fontSize = '17.5px';
    } else {
      document.documentElement.style.fontSize = '16px';
    }
  };

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
      {/* ── Top Sovereign National Strip (DigiLocker Style) ── */}
      <div className="bg-[#0f172a] text-slate-300 text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm leading-none" role="img" aria-label="Flag of India">🇮🇳</span>
            <span className="font-semibold text-slate-200">भारत सरकार</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 font-medium hidden sm:inline">Government of India</span>
            <ExternalLink className="h-3 w-3 text-slate-500" aria-hidden="true" />
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[11px]">
            <a href="#main-content" className="hover:text-white transition hidden md:inline text-slate-400">
              Skip to main content
            </a>
            <div className="hidden sm:flex items-center gap-1 border-x border-slate-700/80 px-2.5">
              <button
                type="button"
                onClick={() => handleFontSizeChange('sm')}
                className={`px-1 rounded hover:text-white transition ${fontSize === 'sm' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
                title="Decrease font size"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => handleFontSizeChange('md')}
                className={`px-1 rounded hover:text-white transition ${fontSize === 'md' ? 'text-amber-400 font-bold' : 'text-slate-300'}`}
                title="Default font size"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => handleFontSizeChange('lg')}
                className={`px-1 rounded hover:text-white transition ${fontSize === 'lg' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
                title="Increase font size"
              >
                A+
              </button>
            </div>
            <div className="flex items-center gap-1 text-slate-300 font-medium">
              <span>English</span>
              <ChevronDown className="h-3 w-3 text-slate-400" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main DigiLocker-Style Navigation Bar ── */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          
          {/* Brand Identity with Sovereign Crest */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-3 group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl p-1">
              {/* Sovereign Crest Logo */}
              <div className="relative shrink-0 flex items-center justify-center">
                <img
                  src="/assets/brand/bhoomi-drishti-logo-navbar.webp"
                  alt="BHOOMI-DRISHTI"
                  width={46}
                  height={46}
                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-blue-900/10 object-cover shadow-xs group-hover:scale-105 transition-transform"
                />
              </div>

              {/* Wordmark and Subtitle */}
              <div className="flex flex-col text-left">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                  BHOOMI<span className="text-blue-600">-DRISHTI</span>
                </span>
                <span className="hidden sm:block text-[11px] font-semibold text-slate-500 tracking-wide">
                  Sovereign Digital Land Infrastructure · National Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Center / Right Navigation Controls */}
          <div className="flex items-center gap-3">
            {loading ? null : !isAuthenticated ? (
              /* ── WHEN NOT LOGGED IN: ONLY show buttons for pages they CAN access! ── */
              <div className="hidden lg:flex items-center gap-3">
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs hover:border-blue-600 hover:text-blue-700 hover:bg-blue-50/30 transition active:scale-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Compass className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  <span>Explore Platform</span>
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition active:scale-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  <span>Login / Register</span>
                </Link>
              </div>
            ) : (
              /* ── WHEN LOGGED IN: Show full platform navigation ── */
              <div className="hidden lg:flex items-center gap-3">
                <nav
                  className="flex items-center gap-1 xl:gap-2 mr-2"
                  aria-label="Primary Platform Navigation"
                >
                  {AUTHENTICATED_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 ${
                            isActive
                              ? 'bg-blue-50 text-blue-800 shadow-2xs ring-1 ring-blue-600/20'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`
                        }
                      >
                        {Icon && <Icon className="h-4 w-4 text-blue-600" aria-hidden="true" />}
                        <span>{item.label}</span>
                        {item.isAi && (
                          <span className="ml-0.5 rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-800 tracking-wide">
                            AI
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </nav>

                {/* Quick Workspace Navigation */}
                <Link
                  to="/workspaces"
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                  title="Collaborative Workspaces"
                >
                  <FolderKanban className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                  <span className="hidden xl:inline">Workspaces</span>
                </Link>

                {/* Saved Bookmarks */}
                <Link
                  to="/saved-research"
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
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
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {user?.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="max-w-[120px] truncate text-slate-900">{user?.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  </button>

                  {/* Dropdown Card */}
                  {isUserMenuOpen && (
                    <div
                      role="menu"
                      aria-label="User options"
                      className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg text-xs z-50 animate-in fade-in zoom-in-95 duration-100"
                    >
                      <div className="border-b border-slate-100 px-3 py-2">
                        <p className="font-bold text-slate-900 truncate max-w-[200px]">{user?.name}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{user?.email}</p>
                        <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-800 uppercase">
                          {user?.role.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 transition"
                        >
                          <UserRound className="h-4 w-4 text-slate-500" />
                          <span>Account Profile</span>
                        </Link>

                        <Link
                          to="/land-records"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 transition"
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
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-rose-700 hover:bg-rose-50 transition font-medium"
                        >
                          <LogOut className="h-4 w-4 text-rose-600" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open mobile navigation"
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <MobileNavigation
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
}
