import { Link } from 'react-router-dom';
import { Compass, BarChart3, Bot, FolderOpen, ArrowRight, Search, Award } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../auth/hooks/useAuth';

export function DashboardQuickServices() {
  const { t } = useLanguage();
  const { activeRole } = useAuth();
  const isCitizen = activeRole === 'PUBLIC';

  const citizenServices = [
    {
      id: 'gis-explorer',
      title: t.quickTools.gisTitle,
      description: t.quickTools.gisDesc,
      icon: Compass,
      link: '/gis',
      accent: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xs',
      badgeText: t.quickTools.gisTag,
      border: 'hover:border-emerald-300',
      actionColor: 'text-emerald-800 group-hover:text-emerald-950',
    },
    {
      id: 'statutory-ai',
      title: t.quickTools.aiTitle,
      description: t.quickTools.aiDesc,
      icon: Bot,
      link: '/assistant',
      accent: 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-xs',
      badgeText: t.quickTools.aiTag,
      border: 'hover:border-amber-300',
      actionColor: 'text-amber-800 group-hover:text-amber-950',
    },
    {
      id: 'registry-search',
      title: 'Cadastre & Deed Registry',
      description: 'Search statewide land records, survey khasra boundaries, and verified digital deeds.',
      icon: Search,
      link: '/explore',
      accent: 'bg-gradient-to-br from-blue-700 to-indigo-800 text-white shadow-xs',
      badgeText: 'Registry',
      border: 'hover:border-blue-300',
      actionColor: 'text-blue-800 group-hover:text-blue-950',
    },
    {
      id: 'my-records',
      title: 'My Issued Land Records',
      description: 'Access legally verified RoR ownership certificates and digitized khasra documents.',
      icon: Award,
      link: '/land-records',
      accent: 'bg-gradient-to-br from-teal-700 to-emerald-800 text-white shadow-xs',
      badgeText: 'Ownership',
      border: 'hover:border-teal-300',
      actionColor: 'text-teal-800 group-hover:text-teal-950',
    },
  ];

  const officialServices = [
    {
      id: 'gis-explorer',
      title: t.quickTools.gisTitle,
      description: t.quickTools.gisDesc,
      icon: Compass,
      link: '/gis',
      accent: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xs',
      badgeText: t.quickTools.gisTag,
      border: 'hover:border-emerald-300',
      actionColor: 'text-emerald-800 group-hover:text-emerald-950',
    },
    {
      id: 'gov-radar',
      title: t.quickTools.govTitle,
      description: t.quickTools.govDesc,
      icon: BarChart3,
      link: '/governance',
      accent: 'bg-gradient-to-br from-blue-700 to-indigo-800 text-white shadow-xs',
      badgeText: t.quickTools.govTag,
      border: 'hover:border-blue-300',
      actionColor: 'text-blue-800 group-hover:text-blue-950',
    },
    {
      id: 'statutory-ai',
      title: t.quickTools.aiTitle,
      description: t.quickTools.aiDesc,
      icon: Bot,
      link: '/assistant',
      accent: 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-xs',
      badgeText: t.quickTools.aiTag,
      border: 'hover:border-amber-300',
      actionColor: 'text-amber-800 group-hover:text-amber-950',
    },
    {
      id: 'sovereign-vault',
      title: t.quickTools.vaultTitle,
      description: t.quickTools.vaultDesc,
      icon: FolderOpen,
      link: '/workspaces',
      accent: 'bg-gradient-to-br from-purple-700 to-slate-900 text-white shadow-xs',
      badgeText: t.quickTools.vaultTag,
      border: 'hover:border-purple-300',
      actionColor: 'text-purple-800 group-hover:text-purple-950',
    },
  ];

  const services = isCitizen ? citizenServices : officialServices;


  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {t.quickTools.heading}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            {t.quickTools.subheading}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((serv) => {
          const Icon = serv.icon;
          return (
            <Link
              key={serv.id}
              to={serv.link}
              className={`group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md ${serv.border} transition-all duration-200 flex flex-col justify-between cursor-pointer`}
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div
                    className={`h-11 w-11 rounded-xl ${serv.accent} flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-900 transition border border-slate-200/60">
                    {serv.badgeText}
                  </span>
                </div>
                <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 group-hover:text-emerald-950 transition">
                  {serv.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {serv.description}
                </p>
              </div>

              <div
                className={`mt-4 pt-3 border-t border-slate-100 flex items-center text-xs sm:text-[13px] font-bold ${serv.actionColor}`}
              >
                <span>{t.quickTools.launchEngine}</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
