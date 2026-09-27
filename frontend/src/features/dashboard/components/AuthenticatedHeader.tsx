import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  ChevronDown,
  Globe,
  User as UserIcon,
  LogOut,
  FileText,
  Shield,
  Briefcase,
  GraduationCap,
  Landmark,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import type { Role } from '../../auth/types/auth';
import { useLanguage, type SupportedLanguage } from '../../../context/LanguageContext';

interface AuthenticatedHeaderProps {
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean;
}

const ROLE_CONFIG: Record<
  Role,
  { label: string; shortLabel: string; badge: string; icon: typeof UserIcon; color: string }
> = {
  PUBLIC: {
    label: 'Verified Citizen',
    shortLabel: 'Citizen',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    icon: UserIcon,
    color: 'text-emerald-700',
  },
  RESEARCHER: {
    label: 'Policy Researcher',
    shortLabel: 'Researcher',
    badge: 'bg-purple-50 text-purple-800 border-purple-300',
    icon: Briefcase,
    color: 'text-purple-700',
  },
  ACADEMIA: {
    label: 'Academic Scholar',
    shortLabel: 'Academia',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    icon: GraduationCap,
    color: 'text-indigo-700',
  },
  GOVERNMENT_OFFICIAL: {
    label: 'Revenue Officer',
    shortLabel: 'Govt Official',
    badge: 'bg-blue-50 text-blue-800 border-blue-300',
    icon: Landmark,
    color: 'text-blue-700',
  },
  ADMIN: {
    label: 'Platform Admin',
    shortLabel: 'Admin',
    badge: 'bg-amber-50 text-amber-800 border-amber-300',
    icon: ShieldCheck,
    color: 'text-amber-700',
  },
};

export function AuthenticatedHeader({
  onToggleMobileSidebar,
  isMobileSidebarOpen,
}: AuthenticatedHeaderProps) {
  const { user, logout, activeRole } = useAuth();
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

  const displayName = user?.name || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  const currentLangOption = options.find((o) => o.code === language) || options[0];
  const activeRoleCfg = ROLE_CONFIG[activeRole] || ROLE_CONFIG.PUBLIC;
  const ActiveRoleIcon = activeRoleCfg.icon;

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

          {/* Right: Static Role Badge, Language Switcher, and User Profile */}
          <div className="flex items-center gap-2 sm:gap-3.5">
            {/* ── Static Read-Only Sovereign Role Clearance Badge ── */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold shadow-2xs ${activeRoleCfg.badge}`}
              title={`Authenticated Sovereign Clearance: ${activeRoleCfg.label} (Verified at Login)`}
            >
              <ActiveRoleIcon className={`h-4 w-4 ${activeRoleCfg.color}`} />
              <span className="hidden sm:inline">{activeRoleCfg.label}</span>
              <span className="sm:hidden">{activeRoleCfg.shortLabel}</span>
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
                <span className="font-medium hidden sm:inline">{currentLangOption.nativeLabel}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${
                    langDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t.header.selectLanguage}
                  </div>
                  {options.map((opt) => {
                    const isSelected = language === opt.code;
                    return (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => {
                          setLanguage(opt.code as SupportedLanguage);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm transition text-left cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>{opt.nativeLabel}</span>
                          <span className="text-[10.5px] text-slate-400">{opt.label}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* User Profile Avatar and Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer focus:outline-hidden"
                aria-label="Open user menu"
              >
                <span className="text-sm font-semibold text-slate-800 hidden md:inline ml-1">
                  {displayName}
                </span>

                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="h-9 w-9 rounded-full object-cover shadow-xs border-2 border-white ring-1 ring-slate-200/80 shrink-0"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-linear-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-sm shadow-xs border-2 border-white ring-1 ring-slate-200/80 shrink-0">
                    {initial}
                  </div>
                )}
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-68 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex items-center gap-3">
                    {user?.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={displayName}
                        referrerPolicy="no-referrer"
                        className="h-10 w-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-linear-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                        {initial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-800 border border-emerald-200/80">
                        <Shield className="h-3 w-3 text-emerald-600" />
                        <span>{activeRoleCfg.label}</span>
                      </div>
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

                    {activeRole !== 'PUBLIC' && (
                      <Link
                        to="/workspaces"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 hover:text-emerald-900 transition"
                      >
                        <Shield className="h-4 w-4 text-slate-400" />
                        <span>{t.header.workspaces}</span>
                      </Link>
                    )}
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
