import { NavLink } from 'react-router-dom';
import {
  Home,
  Award,
  Search,
  FolderOpen,
  Briefcase,
  Compass,
  BarChart3,
  Bot,
  ExternalLink,
  ChevronDown,
  Info,
  BookOpen,
  Landmark,
  ShieldCheck,
  User as UserIcon,
  GraduationCap,
} from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../auth/hooks/useAuth';
import type { Role } from '../../auth/types/auth';

interface AuthenticatedSidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const ROLE_BADGE_INFO: Record<
  Role,
  { title: string; subtitle: string; icon: typeof UserIcon; badgeColor: string }
> = {
  PUBLIC: {
    title: 'Citizen Portal',
    subtitle: 'Public Land Services & Deeds',
    icon: UserIcon,
    badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
  },
  RESEARCHER: {
    title: 'Research Portal',
    subtitle: 'Policy Sandboxes & Literature',
    icon: Briefcase,
    badgeColor: 'bg-purple-50 text-purple-900 border-purple-200/80',
  },
  ACADEMIA: {
    title: 'Academic Portal',
    subtitle: 'Scholarly Workspaces & Datasets',
    icon: GraduationCap,
    badgeColor: 'bg-indigo-50 text-indigo-900 border-indigo-200/80',
  },
  GOVERNMENT_OFFICIAL: {
    title: 'Revenue Portal',
    subtitle: 'Cadastre Admin & Governance',
    icon: Landmark,
    badgeColor: 'bg-blue-50 text-blue-900 border-blue-200/80',
  },
  ADMIN: {
    title: 'Admin Console',
    subtitle: 'Sovereign Platform Management',
    icon: ShieldCheck,
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-200/80',
  },
};

export function AuthenticatedSidebar({ isMobileOpen, onCloseMobile }: AuthenticatedSidebarProps) {
  const [servicesExpanded, setServicesExpanded] = useState(true);
  const { t } = useLanguage();
  const { activeRole } = useAuth();

  const isCitizen = activeRole === 'PUBLIC';
  const isOfficial = activeRole === 'GOVERNMENT_OFFICIAL' || activeRole === 'ADMIN';

  const roleInfo = ROLE_BADGE_INFO[activeRole] || ROLE_BADGE_INFO.PUBLIC;
  const RoleIcon = roleInfo.icon;

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3.5 px-4 py-3 rounded-xl text-[15px] font-semibold transition-all duration-150 ${
      isActive
        ? 'bg-gradient-to-r from-emerald-50 via-teal-50/50 to-transparent text-emerald-950 font-bold border-l-4 border-emerald-600 shadow-xs'
        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80'
    }`;

  const subNavLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 pl-11 pr-4 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150 ${
      isActive
        ? 'text-emerald-900 font-bold bg-emerald-50/80 border-l-2 border-emerald-600'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between py-5 px-3">
      {/* Primary Navigation List */}
      <nav className="space-y-1.5" aria-label="Authenticated Sidebar Navigation">
        {/* Active Role Portal Header Badge */}
        <div className={`p-3 mb-2 rounded-xl border flex items-center gap-2.5 ${roleInfo.badgeColor}`}>
          <div className="p-1.5 rounded-lg bg-white/90 shadow-2xs">
            <RoleIcon className="h-4 w-4 text-slate-800" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-900 truncate">{roleInfo.title}</span>
            <span className="text-[10.5px] text-slate-600 truncate leading-none mt-0.5">
              {roleInfo.subtitle}
            </span>
          </div>
        </div>

        {/* Home */}
        <NavLink to="/dashboard" end className={navLinkClasses} onClick={onCloseMobile}>
          <Home className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-emerald-700" />
          <span>{t.sidebar.home}</span>
        </NavLink>

        {/* Issued Documents (My Land Records) */}
        <NavLink to="/land-records" className={navLinkClasses} onClick={onCloseMobile}>
          <Award className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-emerald-700" />
          <span>{isOfficial ? 'Land Registry & Titles' : t.sidebar.myLandRecords}</span>
        </NavLink>

        {/* Search Documents (Cadastre & Registry Search) */}
        <NavLink to="/explore" className={navLinkClasses} onClick={onCloseMobile}>
          <Search className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-emerald-700" />
          <span>{t.sidebar.registrySearch}</span>
        </NavLink>

        {/* Research Hub & Literature (for Researchers, Academia & Officials) */}
        {!isCitizen && (
          <NavLink to="/research" className={navLinkClasses} onClick={onCloseMobile}>
            <BookOpen className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-emerald-700" />
            <span>Research Hub & Papers</span>
          </NavLink>
        )}

        {/* Collaborative Workspaces & Vault */}
        <NavLink to="/workspaces" className={navLinkClasses} onClick={onCloseMobile}>
          <FolderOpen className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-emerald-700" />
          <div className="flex items-center justify-between flex-1">
            <span>{t.sidebar.workspacesVault}</span>
            {isCitizen && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
                Collab
              </span>
            )}
          </div>
        </NavLink>

        {/* Land Governance Services / Platform Services */}
        <div className="pt-1.5">
          <button
            type="button"
            onClick={() => setServicesExpanded(!servicesExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 transition cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Briefcase className="h-5 w-5 shrink-0 text-slate-500" />
              <span>{t.sidebar.landGovServices}</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                servicesExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {servicesExpanded && (
            <div className="space-y-1 mt-1 animate-in fade-in duration-150">
              <NavLink to="/gis" className={subNavLinkClasses} onClick={onCloseMobile}>
                <Compass className="h-4 w-4 text-emerald-600 shrink-0" />
                <div className="flex items-center justify-between flex-1">
                  <span>{t.sidebar.gisCadastreMap}</span>
                  {isOfficial && (
                    <span className="text-[9.5px] font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">
                      Unmasked
                    </span>
                  )}
                </div>
              </NavLink>

              <NavLink to="/governance" className={subNavLinkClasses} onClick={onCloseMobile}>
                <BarChart3 className="h-4 w-4 text-blue-600 shrink-0" />
                <span>{t.sidebar.revenueGovernance}</span>
              </NavLink>

              <NavLink to="/assistant" className={subNavLinkClasses} onClick={onCloseMobile}>
                <Bot className="h-4 w-4 text-amber-600 shrink-0" />
                <span>{t.sidebar.statutoryAi}</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* About BHOOMI-DRISHTI */}
        <NavLink to="/explore" className={navLinkClasses} onClick={onCloseMobile}>
          <Info className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-emerald-700" />
          <span>{t.sidebar.aboutBhoomi}</span>
        </NavLink>
      </nav>

      {/* Bottom Auxiliary Link: Bhuvan ISRO Geo-Portal */}
      <div className="pt-4 border-t border-slate-200/80 space-y-2">
        <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Sovereign Spatial Registry
        </div>

        <a
          href="https://bhuvan.nrsc.gov.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-gradient-to-r from-emerald-50/70 to-teal-50/40 border border-emerald-200/70 text-slate-800 hover:text-emerald-950 hover:border-emerald-300 hover:shadow-xs transition group"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-xs">
              🛰️
            </span>
            <div className="flex flex-col">
              <span className="text-[13.5px] font-bold text-emerald-950 group-hover:text-emerald-800 leading-tight">
                {t.sidebar.bhuvanPortal}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">
                National Geo-Spatial Portal
              </span>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 text-emerald-600 group-hover:translate-x-0.5 transition" />
        </a>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Width Sidebar */}
      <aside
        className="hidden lg:block w-72 shrink-0 border-r border-slate-200/90 bg-white min-h-[calc(100vh-68px)]"
        aria-label="Desktop Sidebar Navigation"
      >
        <div className="sticky top-17 h-[calc(100vh-68px)] overflow-y-auto">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Off-Canvas Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
