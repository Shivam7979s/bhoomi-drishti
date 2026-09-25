import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Compass, Landmark } from 'lucide-react';

export function HomeFinalCta() {
  return (
    <section aria-label="Explore Platform Call to Action" className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8 space-y-6">
        <h2 className="text-2xl font-black text-slate-900 sm:text-4xl tracking-tight">
          Ready to Explore Land Governance with Evidence?
        </h2>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
          Access spatial parcel cadastre polygons, evaluate state revenue indicators, or query statutory acts
          through our evidence-grounded AI assistant.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link
            to="/governance"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-900 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 active:scale-98"
          >
            <Landmark className="h-4 w-4" aria-hidden="true" />
            <span>Explore Governance</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          <Link
            to="/gis"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 active:scale-98"
          >
            <Compass className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <span>Open GIS Map</span>
          </Link>

          <Link
            to="/assistant"
            className="inline-flex items-center gap-2 rounded-xl border border-teal-300 bg-teal-50/50 px-6 py-3.5 text-sm font-bold text-teal-900 shadow-2xs hover:bg-teal-100/60 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-700 active:scale-98"
          >
            <Bot className="h-4 w-4 text-teal-700" aria-hidden="true" />
            <span>Ask AI Assistant</span>
          </Link>
        </div>

        <p className="text-[11px] text-slate-400 pt-4">
          Smart India Hackathon PS26019 Prototype · Public Open Access Platform
        </p>
      </div>
    </section>
  );
}
