import { useMemo } from 'react';
import { MapPin, Landmark, FileText, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';

export function NationalStatsStrip() {
  const { t } = useLanguage();

  const stats = useMemo(
    () => [
      {
        icon: MapPin,
        value: t.homePage.statParcelsVal,
        label: t.homePage.statParcelsLbl,
        sublabel: t.homePage.statParcelsSub,
        color: 'emerald',
        badge: 'Live GIS',
        to: '/explore?domain=cadastral',
      },
      {
        icon: Landmark,
        value: t.homePage.statDistrictsVal,
        label: t.homePage.statDistrictsLbl,
        sublabel: t.homePage.statDistrictsSub,
        color: 'teal',
        badge: 'State KPIs',
        to: '/explore?domain=governance',
      },
      {
        icon: FileText,
        value: t.homePage.statInstrumentsVal,
        label: t.homePage.statInstrumentsLbl,
        sublabel: t.homePage.statInstrumentsSub,
        color: 'amber',
        badge: 'Verified',
        to: '/explore?domain=statutory',
      },
      {
        icon: ShieldCheck,
        value: t.homePage.statPrecisionVal,
        label: t.homePage.statPrecisionLbl,
        sublabel: t.homePage.statPrecisionSub,
        color: 'indigo',
        badge: 'Audit Grade',
        to: '/explore',
      },
    ],
    [t]
  );

  return (
    <section aria-label="National Land Infrastructure Statistics" className="relative z-10 -mt-6 sm:-mt-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:divide-x lg:divide-slate-100">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                to={stat.to}
                className={`group flex flex-col justify-between rounded-xl p-3 sm:p-4 transition hover:bg-slate-50/80 ${
                  i > 0 ? 'lg:pl-6' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-blue-50 transition">
                    <Icon className="h-5 w-5 text-slate-700 group-hover:text-blue-600 transition" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition">
                    {stat.badge}
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </div>

                <div className="mt-3">
                  <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">{stat.label}</p>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{stat.sublabel}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
