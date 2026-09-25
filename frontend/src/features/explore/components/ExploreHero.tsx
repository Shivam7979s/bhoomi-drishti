import { Compass, Search, MapPin, Landmark, BookOpen, Bot } from 'lucide-react';

interface ExploreHeroProps {
  onScrollToSearch?: () => void;
}

export function ExploreHero({ onScrollToSearch }: ExploreHeroProps) {
  return (
    <section
      aria-label="Explore Platform Introduction"
      className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/60 to-white py-12 sm:py-16"
    >
      {/* Background Subtle Spatial Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:32px_32px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-4">
          {/* Context Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1 text-xs font-semibold text-emerald-900 shadow-2xs">
            <Compass className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
            <span>Public Information Discovery</span>
            <span className="text-emerald-300">·</span>
            <span className="text-emerald-800">BHOOMI-DRISHTI</span>
          </div>

          {/* Primary H1 */}
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Explore <span className="text-emerald-800">Land Governance</span> Data
          </h1>

          {/* Descriptive Body */}
          <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl mx-auto">
            Discover state revenue indicator frameworks, spatial cadastre boundaries, published statutory and policy documents,
            and evidence-grounded AI intelligence through one connected, transparent portal.
          </p>

          {/* Quick Jump Navigation Anchor Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
            <a
              href="#explore-search"
              onClick={(e) => {
                if (onScrollToSearch) {
                  e.preventDefault();
                  onScrollToSearch();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-emerald-800 transition"
            >
              <Search className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              <span>Search Information</span>
            </a>

            <a
              href="#explore-domains"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-emerald-800 transition"
            >
              <Landmark className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              <span>Explore Domains</span>
            </a>

            <a
              href="#explore-geography"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-emerald-800 transition"
            >
              <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              <span>Explore by Geography</span>
            </a>

            <a
              href="#explore-featured"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-emerald-800 transition"
            >
              <BookOpen className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              <span>Featured Documents</span>
            </a>

            <a
              href="#explore-assistant"
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/70 px-3 py-1.5 text-xs font-medium text-teal-800 shadow-2xs hover:bg-teal-100 transition"
            >
              <Bot className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
              <span>Ask AI Assistant</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
