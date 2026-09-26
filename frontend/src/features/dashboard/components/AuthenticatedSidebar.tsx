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
  Globe2,
} from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';

interface AuthenticatedSidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AuthenticatedSidebar({ isMobileOpen, onCloseMobile }: AuthenticatedSidebarProps) {
  const [servicesExpanded, setServicesExpanded] = useState(true);
  const { t } = useLanguage();

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
        {/* Home */}
        <NavLink to="/dashboard" end className={navLinkClasses} onClick={onCloseMobile}>
          <Home className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-emerald-700" />
          <span>{t.sidebar.home}</span>
        </NavLink>

        {/* Issued Documents (My Land Records) */}
        <NavLink to="/land-records" className={navLinkClasses} onClick={onCloseMobile}>
          <Award className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-emerald-700" />
          <span>{t.sidebar.myLandRecords}</span>
        </NavLink>

        {/* Search Documents (Cadastre & Registry Search) */}
        <NavLink to="/explore" className={navLinkClasses} onClick={onCloseMobile}>
          <Search className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-emerald-700" />
          <span>{t.sidebar.registrySearch}</span>
        </NavLink>

        {/* Drive (Sovereign Vault & Workspaces) */}
        <NavLink to="/workspaces" className={navLinkClasses} onClick={onCloseMobile}>
          <FolderOpen className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-emerald-700" />
          <span>{t.sidebar.workspacesVault}</span>
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
                <span>{t.sidebar.gisCadastreMap}</span>
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

      {/* Bottom Auxiliary Link: Bhuvan ISRO Geo-Portal (Access UMANG removed as requested) */}
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
      {/* Desktop Sticky Sidebar (Width: w-72 for generous, comfortable readability) */}
      <aside className="hidden lg:block w-72 shrink-0 bg-white border-r border-slate-200/90 min-h-[calc(100vh-4.25rem)] shadow-xs">
        <div className="sticky top-[4.25rem] h-[calc(100vh-4.25rem)] overflow-y-auto">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-emerald-700" />
                <span className="text-sm font-bold text-slate-900">BHOOMI-DRISHTI Menu</span>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
