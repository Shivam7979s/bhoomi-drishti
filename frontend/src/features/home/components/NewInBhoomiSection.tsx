import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  FileCheck,
  Landmark,
  Layers,
  Scale,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

export function NewInBhoomiSection() {
  const { t } = useLanguage();

  const services = useMemo(
    () => [
      {
        id: 'registered-deed',
        title: t.homePage.newDeedTitle,
        category: 'Cadastral Records',
        description: t.homePage.newDeedDesc,
        badge: 'Live Cadastre',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: FileCheck,
        iconColor: 'text-emerald-700 bg-emerald-50',
        to: '/explore?domain=cadastral',
      },
      {
        id: 'rfctlarr',
        title: t.homePage.newActTitle,
        category: 'Statutory Act',
        description: t.homePage.newActDesc,
        badge: 'Central Act',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Scale,
        iconColor: 'text-blue-700 bg-blue-50',
        to: '/explore?q=RFCTLARR',
      },
      {
        id: 'leasing-act',
        title: t.homePage.newLeasingTitle,
        category: 'Tenancy Policy',
        description: t.homePage.newLeasingDesc,
        badge: 'Model Policy',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: Landmark,
        iconColor: 'text-purple-700 bg-purple-50',
        to: '/explore?q=leasing',
      },
      {
        id: 'dilrmp',
        title: t.homePage.newDilrmpTitle,
        category: 'National Standard',
        description: t.homePage.newDilrmpDesc,
        badge: 'Digitization',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: Layers,
        iconColor: 'text-amber-700 bg-amber-50',
        to: '/explore?q=DILRMP',
      },
      {
        id: 'governance-index',
        title: t.homePage.newVelocityTitle,
        category: 'Revenue Index',
        description: t.homePage.newVelocityDesc,
        badge: 'KPI Index',
        badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
        icon: TrendingUp,
        iconColor: 'text-teal-700 bg-teal-50',
        to: '/explore?domain=governance',
      },
      {
        id: 'statutory-ai',
        title: t.homePage.newAiTitle,
        category: 'Legal AI',
        description: t.homePage.newAiDesc,
        badge: 'AI Grounded',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: Bot,
        iconColor: 'text-indigo-700 bg-indigo-50',
        to: '/explore?domain=assistant',
      },
    ],
    [t]
  );

  return (
    <section aria-labelledby="new-in-bhoomi-heading" className="py-12 sm:py-16 bg-white border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">
              {t.homePage.newBadge}
            </span>
            <h2 id="new-in-bhoomi-heading" className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {t.homePage.newTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              {t.homePage.newSub}
            </p>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-900 transition shrink-0 group"
          >
            <span>{t.homePage.newViewAll}</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Horizontal Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.to}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 hover:-translate-y-1"
              >
                <div className="space-y-3">
                  {/* Top card header */}
                  <div className="flex items-center justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconColor} group-hover:scale-105 transition-transform`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Bottom metadata */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-emerald-700 transition-colors">
                  <span className="font-semibold text-slate-500">{item.category}</span>
                  <div className="flex items-center gap-1 font-bold">
                    <span>Explore</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
