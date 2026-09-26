import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Bot,
  ChevronDown,
  Compass,
  FolderKanban,
  Home,
  Landmark,
  LogIn,
  LogOut,
  Map,
  MapPinned,
  Menu,
  UserRound,
  Globe,
  Check,
} from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { MobileNavigation } from './MobileNavigation';

export function PublicHeader() {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const { language, setLanguage, t, options } = useLanguage();
  const navigate = useNavigate();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');

  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const currentLangOption = options.find((o) => o.code === language) || options[0];

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

  // Close user dropdown and language dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (isUserMenuOpen) {
          setIsUserMenuOpen(false);
          userButtonRef.current?.focus();
        }
        if (langDropdownOpen) {
          setLangDropdownOpen(false);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen, langDropdownOpen]);

  return (
    <>
      {/* ── Main Sovereign Navigation Bar (Clean & Elevated, No Top Dark Strip) ── */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          
          {/* Brand Identity with Sovereign Crest */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-3 group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-xl p-1">
              {/* Sovereign Crest Logo */}
              <div className="relative shrink-0 flex items-center justify-center">
                <img
                  src="/assets/brand/bhoomi-drishti-logo-navbar.webp"
                  alt="BHOOMI-DRISHTI"
                  width={46}
                  height={46}
                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-emerald-800/20 object-cover shadow-xs group-hover:scale-105 transition-transform"
                />
              </div>

              {/* Wordmark and Subtitle */}
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                    BHOOMI<span className="text-emerald-700">-DRISHTI</span>
                  </span>
                </div>
                <span className="hidden sm:block text-[11px] font-semibold text-slate-500 tracking-wide">
                  {t.header.sovereignTagline}
                </span>
              </div>
            </Link>
          </div>

          {/* Right Navigation & Accessibility Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Font Size Accessibility Controls (A+ A A-) */}
            <div className="hidden md:flex items-center rounded-lg border border-slate-200/90 bg-slate-100/70 p-0.5 text-xs text-slate-700 shadow-2xs">
              <button
                type="button"
                onClick={() => handleFontSizeChange('lg')}
                className={`px-2 py-0.5 rounded-md hover:bg-white transition cursor-pointer ${
                  fontSize === 'lg' ? 'bg-white font-bold text-emerald-800 shadow-2xs' : 'font-semibold text-slate-600'
                }`}
                title={t.header.fontLarge}
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => handleFontSizeChange('md')}
                className={`px-2 py-0.5 rounded-md hover:bg-white transition cursor-pointer ${
                  fontSize === 'md' ? 'bg-white font-bold text-emerald-800 shadow-2xs' : 'font-semibold text-slate-600'
                }`}
                title={t.header.fontNormal}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => handleFontSizeChange('sm')}
                className={`px-2 py-0.5 rounded-md hover:bg-white transition cursor-pointer ${
                  fontSize === 'sm' ? 'bg-white font-bold text-emerald-800 shadow-2xs' : 'font-semibold text-slate-600'
                }`}
                title={t.header.fontSmall}
              >
                A-
              </button>
            </div>

            {/* Language Selector Dropdown (English, हिन्दी, मराठी, తెలుగు) */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50/40 shadow-2xs transition cursor-pointer"
                aria-label={t.header.selectLanguage}
              >
                <Globe className="h-4 w-4 text-emerald-700" />
                <span className="font-bold">{currentLangOption.nativeLabel}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${
                    langDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 divide-y divide-slate-100">
                  <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t.header.selectLanguage}
                  </div>
                  <div className="py-1">
                    {options.map((opt) => {
                      const isSelected = opt.code === language;
                      return (
                        <button
                          key={opt.code}
                          type="button"
                          onClick={() => {
                            setLanguage(opt.code);
                            setLangDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 font-bold text-emerald-900'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950 font-medium'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{opt.nativeLabel}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{opt.label}</span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-emerald-700 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Auth / Action Buttons */}
            {loading ? null : !isAuthenticated ? (
              /* ── WHEN NOT LOGGED IN ── */
              <div className="hidden lg:flex items-center gap-2.5 shrink-0">
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:border-emerald-600 hover:text-emerald-800 hover:bg-emerald-50/30 transition whitespace-nowrap active:scale-95 focus:outline-hidden"
                >
                  <Compass className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  <span>{t.header.explorePlatform}</span>
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:shadow-sm transition whitespace-nowrap active:scale-95 focus:outline-hidden"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  <span>{t.header.loginRegister}</span>
                </Link>
              </div>
            ) : (
              /* ── WHEN LOGGED IN ── Clean, unwrapped, responsive header ── */
              <div className="hidden lg:flex items-center gap-2.5 shrink-0">
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-800 hover:bg-emerald-50/40 shadow-2xs transition whitespace-nowrap focus:outline-hidden"
                >
                  <Compass className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  <span>{t.header.explorePlatform}</span>
                </Link>

                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:shadow-sm transition active:scale-95 whitespace-nowrap focus:outline-hidden"
                >
                  <Home className="h-4 w-4" aria-hidden="true" />
                  <span>{t.header.dashboard}</span>
                </Link>

                <div className="h-4 w-px bg-slate-200 mx-0.5" aria-hidden="true" />

                {/* User Dropdown Menu */}
                <div className="relative shrink-0" ref={userMenuRef}>
                  <button
                    ref={userButtonRef}
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="menu"
                    aria-label="User account menu"
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-emerald-300 transition focus:outline-hidden whitespace-nowrap cursor-pointer"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white shrink-0">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                    <span className="max-w-[110px] truncate text-slate-900 font-bold hidden sm:inline">
                      {user?.name || 'Citizen'}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  </button>

                  {/* Dropdown Card */}
                  {isUserMenuOpen && (
                    <div
                      role="menu"
                      aria-label="User options"
                      className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl text-xs z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100"
                    >
                      <div className="px-3 py-2.5">
                        <p className="font-bold text-slate-900 truncate max-w-[220px]">{user?.name}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[220px]">{user?.email}</p>
                        <span className="mt-1.5 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 uppercase tracking-wide">
                          {user?.role?.replace('_', ' ') || 'VERIFIED CITIZEN'}
                        </span>
                      </div>

                      <div className="py-1.5 space-y-0.5">
                        <Link
                          to="/dashboard"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-bold text-emerald-950 bg-emerald-50/70 hover:bg-emerald-100/70 transition"
                        >
                          <Home className="h-4 w-4 text-emerald-700 shrink-0" />
                          <span className="truncate">{t.header.dashboard}</span>
                        </Link>

                        <Link
                          to="/land-records"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition font-medium"
                        >
                          <MapPinned className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="truncate">{t.header.myLandRecords}</span>
                        </Link>

                        <Link
                          to="/gis"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition font-medium"
                        >
                          <Map className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="truncate">{t.sidebar.gisCadastreMap}</span>
                        </Link>

                        <Link
                          to="/governance"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition font-medium"
                        >
                          <Landmark className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="truncate">{t.sidebar.revenueGovernance}</span>
                        </Link>

                        <Link
                          to="/assistant"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition font-medium"
                        >
                          <Bot className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="truncate">{t.sidebar.statutoryAi}</span>
                          <span className="ml-auto rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                            AI
                          </span>
                        </Link>

                        <Link
                          to="/workspaces"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition font-medium"
                        >
                          <FolderKanban className="h-4 w-4 text-indigo-600 shrink-0" />
                          <span className="truncate">{t.header.workspaces}</span>
                        </Link>

                        <Link
                          to="/saved-research"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition font-medium"
                        >
                          <Bookmark className="h-4 w-4 text-amber-600 shrink-0" />
                          <span className="truncate">{t.header.savedResearch}</span>
                        </Link>

                        <Link
                          to="/profile"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition font-medium"
                        >
                          <UserRound className="h-4 w-4 text-slate-500 shrink-0" />
                          <span className="truncate">{t.header.profile}</span>
                        </Link>
                      </div>

                      <div className="pt-1.5">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-rose-700 hover:bg-rose-50 hover:text-rose-900 transition font-semibold cursor-pointer"
                        >
                          <LogOut className="h-4 w-4 text-rose-600 shrink-0" />
                          <span>{t.header.logout}</span>
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
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition focus:outline-hidden"
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
