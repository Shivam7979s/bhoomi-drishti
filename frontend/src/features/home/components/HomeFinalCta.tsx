import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Compass, Landmark, LogIn } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';

export function HomeFinalCta() {
  const { isAuthenticated } = useAuth();

  return (
    <section aria-label="Explore Platform Call to Action" className="py-16 sm:py-24 bg-white border-t border-slate-200/80">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8 space-y-6">
        <h2 className="text-2xl font-black text-slate-900 sm:text-4xl tracking-tight">
          Ready to Explore Land Governance with Evidence?
        </h2>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
          Access spatial parcel cadastre polygons, evaluate state revenue indicators, or query statutory acts
          through our evidence-grounded public portal.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {!isAuthenticated ? (
            /* ── Unauthenticated Visitor: Public Explore & Login only! ── */
            <>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition active:scale-95"
              >
                <Compass className="h-4 w-4" aria-hidden="true" />
                <span>Explore Public Datasets</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 hover:text-blue-700 transition active:scale-95"
              >
                <LogIn className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <span>Login / Register</span>
              </Link>
            </>
          ) : (
            /* ── Authenticated User: Direct module access ── */
            <>
              <Link
                to="/governance"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-98"
              >
                <Landmark className="h-4 w-4" aria-hidden="true" />
                <span>Explore Governance</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link
                to="/gis"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-98"
              >
                <Compass className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span>Open GIS Map</span>
              </Link>

              <Link
                to="/assistant"
                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/50 px-6 py-3.5 text-sm font-bold text-blue-900 shadow-2xs hover:bg-blue-100/60 transition active:scale-98"
              >
                <Bot className="h-4 w-4 text-blue-700" aria-hidden="true" />
                <span>Ask AI Assistant</span>
              </Link>
            </>
          )}
        </div>

        <p className="text-[11px] text-slate-400 pt-4">
          BHOOMI-DRISHTI Sovereign Digital Land Infrastructure · National Land Governance Platform
        </p>
      </div>
    </section>
  );
}
