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
  Landmark,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  RefreshCw,
  Sparkles,
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
  { label: string; shortLabel: string; badge: string; icon: typeof UserIcon; color: string; desc: string }
> = {
  PUBLIC: {
    label: 'Citizen / Public',
    shortLabel: 'Citizen',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    icon: UserIcon,
    color: 'text-emerald-700',
    desc: 'Public spatial maps, masked PII, legal AI assistant',
  },
  RESEARCHER: {
    label: 'Policy Researcher',
    shortLabel: 'Researcher',
    badge: 'bg-purple-50 text-purple-800 border-purple-300',
    icon: Briefcase,
    color: 'text-purple-700',
    desc: 'Research workspaces, policy simulations, vector ingestion',
  },
  ACADEMIA: {
    label: 'Academic Scholar',
    shortLabel: 'Academia',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    icon: GraduationCap,
    color: 'text-indigo-700',
    desc: 'Academic research dossiers, datasets & citations',
  },
  GOVERNMENT_OFFICIAL: {
    label: 'Revenue Officer',
    shortLabel: 'Govt Official',
    badge: 'bg-blue-50 text-blue-800 border-blue-300',
    icon: Landmark,
    color: 'text-blue-700',
    desc: 'Unmasked cadastral deeds, dispute certification, radar KPIs',
  },
  ADMIN: {
    label: 'Platform Admin',
    shortLabel: 'Admin',
    badge: 'bg-amber-50 text-amber-800 border-amber-300',
    icon: ShieldCheck,
    color: 'text-amber-700',
    desc: 'Full sovereign platform control, user promotion & audit',
  },
};

const SWITCHABLE_ROLES: Role[] = ['PUBLIC', 'RESEARCHER', 'GOVERNMENT_OFFICIAL', 'ADMIN'];

export function AuthenticatedHeader({
  onToggleMobileSidebar,
  isMobileSidebarOpen,
}: AuthenticatedHeaderProps) {
  const { user, logout, activeRole, isSimulatedRole, switchRole } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage, t, options } = useLanguage();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
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

          {/* Right: Role Switcher, Language Switcher, and User Profile */}
          <div className="flex items-center gap-2 sm:gap-3.5">
            {/* ── Active Role Clearance Badge & Live Switcher ── */}
            <div className="relative" ref={roleRef}>
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition cursor-pointer shadow-2xs ${activeRoleCfg.badge} hover:shadow-xs`}
                title="Click to switch authorization perspective for demonstration"
              >
                <ActiveRoleIcon className={`h-4 w-4 ${activeRoleCfg.color}`} />
                <span className="hidden sm:inline font-bold">{activeRoleCfg.shortLabel}</span>
                {isSimulatedRole && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-200/80 text-amber-900 text-[9.5px] font-black uppercase tracking-wider">
                    Demo
                  </span>
                )}
                <ChevronDown
                  className={`h-3 w-3 text-slate-400 transition-transform duration-150 ${
                    roleDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 divide-y divide-slate-100">
                  <div className="px-4 py-2.5 bg-slate-50/70 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-emerald-600" />
                        Role Clearance Perspective
                      </span>
                      {isSimulatedRole && (
                        <button
                          type="button"
                          onClick={() => {
                            switchRole(null);
                            setRoleDropdownOpen(false);
                          }}
                          className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="h-2.5 w-2.5" />
                          Reset
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      Switch perspectives to test RBAC permissions, PII masking, and official tools.
                    </p>
                  </div>

                  <div className="p-2 space-y-1">
                    {SWITCHABLE_ROLES.map((r) => {
                      const cfg = ROLE_CONFIG[r];
                      const Icon = cfg.icon;
                      const isSelected = activeRole === r;

                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            switchRole(r);
                            setRoleDropdownOpen(false);
                          }}
                          className={`w-full flex items-start gap-3 p-2.5 rounded-xl transition cursor-pointer text-left ${
                            isSelected
                              ? 'bg-slate-100/90 border border-slate-200 shadow-2xs'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                              isSelected ? 'bg-white shadow-xs' : 'bg-slate-100'
                            }`}
                          >
                            <Icon className={`h-4 w-4 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm font-bold text-slate-900">
                                {cfg.label}
                              </span>
                              {isSelected && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{cfg.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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
                      <span>{activeRoleCfg.label}</span>
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
