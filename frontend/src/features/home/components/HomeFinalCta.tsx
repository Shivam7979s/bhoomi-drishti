import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Compass, Landmark, LogIn } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';

export function HomeFinalCta() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  return (
    <section aria-label="Explore Platform Call to Action" className="py-16 sm:py-24 bg-white border-t border-slate-200/80">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8 space-y-6">
        <h2 className="text-2xl font-black text-slate-900 sm:text-4xl tracking-tight">
          {t.homePage.ctaTitle}
        </h2>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
          {t.homePage.ctaSub}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {!isAuthenticated ? (
            /* ── Unauthenticated Visitor ── */
            <>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition active:scale-95"
              >
                <Compass className="h-4 w-4" aria-hidden="true" />
                <span>{t.homePage.ctaBtnExplore}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 hover:text-emerald-800 transition active:scale-95"
              >
                <LogIn className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                <span>{t.homePage.ctaBtnLogin}</span>
              </Link>
            </>
          ) : (
            /* ── Authenticated User ── */
            <>
              <Link
                to="/governance"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-700 to-teal-800 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:from-emerald-800 hover:to-teal-900 transition active:scale-98"
              >
                <Landmark className="h-4 w-4" aria-hidden="true" />
                <span>{t.homePage.ctaBtnGovernance}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link
                to="/gis"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-emerald-800 transition active:scale-98"
              >
                <Compass className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span>{t.homePage.ctaBtnGis}</span>
              </Link>

              <Link
                to="/assistant"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-emerald-800 transition active:scale-98"
              >
                <Bot className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                <span>{t.sidebar.statutoryAi}</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
