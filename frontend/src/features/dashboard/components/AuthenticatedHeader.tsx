import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Shield,
  FileText,
  Globe,
  Check,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useLanguage, type SupportedLanguage } from '../../../context/LanguageContext';

interface AuthenticatedHeaderProps {
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean;
}

export function AuthenticatedHeader({
  onToggleMobileSidebar,
  isMobileSidebarOpen,
}: AuthenticatedHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage, t, options } = useLanguage();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/', { replace: true });
  }

  // Get user display initial or name
  const displayName = user?.name || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  const currentLangOption = options.find((o) => o.code === language) || options[0];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-17">
          {/* Left: Mobile Toggle + Sovereign Emblem & Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* BHOOMI-DRISHTI Official Project Logo & Sovereign Identity */}
            <Link to="/dashboard" className="flex items-center gap-3.5 focus:outline-hidden group">
              <div className="relative shrink-0 flex items-center justify-center">
                <img
                  src="/assets/brand/bhoomi-drishti-logo-navbar.webp"
                  alt="BHOOMI-DRISHTI Logo"
                  width={46}
                  height={46}
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border border-emerald-800/20 object-cover shadow-xs group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    BHOOMI<span className="text-emerald-700">-DRISHTI</span>
                  </span>
                </div>
                <span className="text-[11.5px] font-medium text-slate-500 tracking-tight leading-none mt-0.5">
                  {t.header.sovereignTagline}
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Accessibility font sizer, Language Switcher, and User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Font Size Accessibility Controls (A+ A A-) */}
            <div className="hidden md:flex items-center rounded-lg border border-slate-200/90 bg-slate-100/70 p-0.5 text-xs text-slate-700 shadow-2xs">
              <button
                type="button"
                onClick={() => (document.documentElement.style.fontSize = '17px')}
                className="px-2.5 py-1 rounded-md hover:bg-white hover:text-emerald-900 font-semibold transition cursor-pointer"
                title={t.header.fontLarge}
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => (document.documentElement.style.fontSize = '16px')}
                className="px-2.5 py-1 rounded-md bg-white shadow-2xs font-bold text-emerald-800 transition cursor-pointer"
                title={t.header.fontNormal}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => (document.documentElement.style.fontSize = '15px')}
                className="px-2.5 py-1 rounded-md hover:bg-white hover:text-emerald-900 transition cursor-pointer"
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
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50/40 shadow-2xs transition cursor-pointer"
                aria-label={t.header.selectLanguage}
              >
                <Globe className="h-4 w-4 text-emerald-700" />
                <span className="font-medium">{currentLangOption.nativeLabel}</span>
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
                            setLanguage(opt.code as SupportedLanguage);
                            setLangDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-900 font-bold'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                          }`}
                        >
                          <div className="flex flex-col text-left">
                            <span className="text-slate-900 font-semibold">{opt.nativeLabel}</span>
                            <span className="text-[11px] text-slate-500">{opt.label}</span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-emerald-700" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1 pl-2.5 rounded-full border border-slate-200 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-300 transition focus:outline-hidden cursor-pointer shadow-2xs"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
              >
                <span className="hidden sm:inline text-xs sm:text-sm font-bold text-slate-800 max-w-[130px] truncate">
                  {displayName}
                </span>
                <div className="h-8.5 w-8.5 rounded-full bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center font-bold text-sm shadow-xs border border-white">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt={displayName}
                      className="h-8.5 w-8.5 rounded-full object-cover"
                    />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-68 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                    <p className="text-sm font-bold text-slate-900">{displayName}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-800 border border-emerald-200/80">
                      <Shield className="h-3 w-3 text-emerald-600" />
                      <span>{user?.role?.replace('_', ' ') || 'CITIZEN'}</span>
                    </div>
                  </div>

                  <div className="py-1.5 text-xs sm:text-sm font-medium text-slate-700">
                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 hover:text-emerald-900 transition"
                    >
                      <UserIcon className="h-4 w-4 text-slate-400" />
                      <span>{t.header.profile}</span>
                    </Link>

                    <Link
                      to="/land-records"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 hover:text-emerald-900 transition"
                    >
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span>{t.header.myLandRecords}</span>
                    </Link>

                    <Link
                      to="/workspaces"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 hover:text-emerald-900 transition"
                    >
                      <Shield className="h-4 w-4 text-slate-400" />
                      <span>{t.header.workspaces}</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 text-rose-500" />
                      <span>{t.header.logout}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
