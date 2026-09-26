import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';

export function NewInBhoomiGrid() {
  const { t } = useLanguage();

  const services = [
    {
      id: 'reg-deed-mp',
      title: t.stateServices.mpTitle,
      subtitle: t.stateServices.mpSub,
      issuer: t.stateServices.mpDept,
      cardBg: 'bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-rose-300',
      emblemColor: 'bg-gradient-to-br from-rose-700 to-rose-900 text-white shadow-xs',
      emblemInitials: 'MP',
      link: '/land-records',
    },
    {
      id: 'khasra-up',
      title: t.stateServices.upTitle,
      subtitle: t.stateServices.upSub,
      issuer: t.stateServices.upDept,
      cardBg: 'bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-blue-300',
      emblemColor: 'bg-gradient-to-br from-blue-700 to-blue-900 text-white shadow-xs',
      emblemInitials: 'UP',
      link: '/land-records',
    },
    {
      id: 'mutation-mh',
      title: t.stateServices.mhTitle,
      subtitle: t.stateServices.mhSub,
      issuer: t.stateServices.mhDept,
      cardBg: 'bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-amber-400',
      emblemColor: 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-xs',
      emblemInitials: 'MH',
      link: '/land-records',
    },
    {
      id: 'cadastre-gj',
      title: t.stateServices.gjTitle,
      subtitle: t.stateServices.gjSub,
      issuer: t.stateServices.gjDept,
      cardBg: 'bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-emerald-300',
      emblemColor: 'bg-gradient-to-br from-emerald-700 to-teal-800 text-white shadow-xs',
      emblemInitials: 'GJ',
      link: '/gis',
    },
  ];

  return (
    <section className="mb-9">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {t.stateServices.heading}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            {t.stateServices.subheading}
          </p>
        </div>
        <Link
          to="/explore"
          className="text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 transition flex items-center gap-1"
        >
          <span>{t.stateServices.viewAll}</span>
          <span>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className={`flex flex-col justify-between p-4.5 rounded-2xl border ${service.cardBg} transition-all duration-200 shadow-xs hover:shadow-md`}
          >
            {/* Top: Circular State Emblem & Service Info */}
            <div className="flex items-start gap-3.5">
              <div
                className={`h-11 w-11 rounded-2xl shrink-0 flex items-center justify-center font-black text-xs ring-4 ring-slate-100 ${service.emblemColor}`}
              >
                {service.emblemInitials}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-[13.5px] font-bold text-slate-900 leading-tight">
                  {service.title}
                </h3>
                <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                  {service.subtitle}
                </p>
                <p className="text-[11.5px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                  {service.issuer}
                </p>
              </div>
            </div>

            {/* Bottom: "Available Now" Pill Button */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
              <Link
                to={service.link}
                className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 hover:bg-emerald-700 hover:text-white hover:border-emerald-700 shadow-2xs transition active:scale-95 cursor-pointer"
              >
                {t.stateServices.availableNow}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
