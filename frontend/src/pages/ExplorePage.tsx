import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Compass,
  BookOpen,
  Building2,
  Scale,
  Bot,
  ExternalLink,
} from 'lucide-react';
import type { DocumentType } from '../features/research/types/research';
import { useExploreData } from '../features/explore/hooks/useExploreData';
import { ExploreSearch } from '../features/explore/components/ExploreSearch';
import { ExploreResults } from '../features/explore/components/ExploreResults';
import { ExploreDomainGrid } from '../features/explore/components/ExploreDomainGrid';
import { ExploreGeography } from '../features/explore/components/ExploreGeography';
import { ExploreFeaturedContent } from '../features/explore/components/ExploreFeaturedContent';
import { ExploreAssistantCta } from '../features/explore/components/ExploreAssistantCta';
import { useLanguage } from '../context/LanguageContext';

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchSectionRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const initialQuery = searchParams.get('q') || '';
  const initialType = (searchParams.get('type') as DocumentType | '') || '';

  const {
    query,
    setQuery,
    documentType,
    setDocumentType,
    currentPage,
    searchResults,
    isSearching,
    searchError,
    hasSearched,
    triggerSearch,
    clearSearch,
    featuredDocs,
    isFeaturedLoading,
    featuredError,
    gisOptions,
    isGisLoading,
    gisError,
  } = useExploreData(initialQuery, initialType);

  // Synchronize document title
  useEffect(() => {
    document.title = 'Registry & Cadastre Search — BHOOMI-DRISHTI';
  }, []);

  // Update URL search parameters when search query changes
  const handlePerformSearch = (nextQuery: string, nextType: DocumentType | '') => {
    const trimmed = nextQuery.trim();
    const params = new URLSearchParams();
    if (trimmed) {
      params.set('q', trimmed);
    }
    if (nextType) {
      params.set('type', nextType);
    }
    setSearchParams(params, { replace: true });
    triggerSearch(trimmed, nextType, 0);
  };

  const handleClearSearch = () => {
    setSearchParams({}, { replace: true });
    clearSearch();
  };

  const handlePageChange = (newPage: number) => {
    triggerSearch(query, documentType, newPage);
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const statePortals = [
    {
      id: 'mp-bhulekh',
      state: 'Madhya Pradesh',
      portal: 'MP Bhulekh & e-Panjiyan',
      abbr: 'MP',
      color: 'bg-rose-700 text-white',
      badge: 'B-1 / Khasra Online',
      url: 'https://mpbhulekh.gov.in/',
    },
    {
      id: 'up-bhulekh',
      state: 'Uttar Pradesh',
      portal: 'UP Bhulekh & Revenue Court',
      abbr: 'UP',
      color: 'bg-blue-800 text-white',
      badge: 'Khatauni Verification',
      url: 'https://upbhulekh.gov.in/',
    },
    {
      id: 'mh-bhulekh',
      state: 'Maharashtra',
      portal: 'Mahabhulekh & e-Ferfar',
      abbr: 'MH',
      color: 'bg-amber-700 text-white',
      badge: '7/12 & 8A Extract',
      url: 'https://bhulekh.mahabhumi.gov.in/',
    },
    {
      id: 'gj-anyror',
      state: 'Gujarat',
      portal: 'AnyRoR & Bhu-Naksha',
      abbr: 'GJ',
      color: 'bg-emerald-800 text-white',
      badge: 'VF-7 / VF-8A Online',
      url: 'https://anyror.gujarat.gov.in/',
    },
  ];

  return (
    <div className="space-y-7 pb-12">
      {/* ── 1. Sovereign Breadcrumb & Header ── */}
      <div className="border-b border-slate-200/90 pb-5">
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
          <Link to="/dashboard" className="hover:text-emerald-800 transition">
            {t.explorePage.breadcrumbHome}
          </Link>
          <span>/</span>
          <span className="text-emerald-950 font-bold">
            {t.explorePage.breadcrumbCurrent}
          </span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              {t.explorePage.pageTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              {t.explorePage.pageSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/gis"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/80 px-3.5 py-2 text-xs sm:text-sm font-bold text-emerald-900 shadow-2xs hover:bg-emerald-100 transition"
            >
              <Compass className="h-4 w-4 text-emerald-700" />
              <span>GIS Cadastre Map</span>
            </Link>

            <Link
              to="/assistant"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:from-emerald-800 hover:to-teal-900 transition"
            >
              <Bot className="h-4 w-4" />
              <span>{t.explorePage.askAiPrompt}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. Top Cadastral Metric KPI Summary Chips ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t.explorePage.metricStatutes}
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              50+ <span className="text-xs font-semibold text-slate-500">Acts & Rules</span>
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t.explorePage.metricStates}
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              28 <span className="text-xs font-semibold text-slate-500">States & UTs</span>
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-2xs">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t.explorePage.metricPrecedents}
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              1,200+ <span className="text-xs font-semibold text-slate-500">Citations</span>
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0 border border-teal-200/60 shadow-2xs">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t.explorePage.metricAiIndex}
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 flex items-center gap-2">
              <span>100%</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. State Cadastral Registries Quick-Access ── */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {t.explorePage.statePortalsHeading}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              {t.explorePage.statePortalsSub}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statePortals.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 p-4.5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`h-11 w-11 rounded-2xl shrink-0 flex items-center justify-center font-black text-xs ring-4 ring-slate-100 ${p.color}`}
                >
                  {p.abbr}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60 mb-1">
                    {p.badge}
                  </span>
                  <h3 className="text-xs sm:text-[13.5px] font-bold text-slate-900 leading-tight group-hover:text-emerald-950 transition">
                    {p.portal}
                  </h3>
                  <p className="text-[11.5px] text-slate-500 mt-0.5">{p.state}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-800 group-hover:text-emerald-950">
                <span>Access Portal</span>
                <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── 4. Unified Sovereign Search & Results Section ── */}
      <section ref={searchSectionRef} className="space-y-4">
        <div className="border-b border-slate-200/90 pb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
            Information Retrieval
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            {t.explorePage.resultsHeading}
          </h2>
        </div>

        <ExploreSearch
          query={query}
          onQueryChange={setQuery}
          documentType={documentType}
          onDocumentTypeChange={setDocumentType}
          onSearch={handlePerformSearch}
          onClear={handleClearSearch}
          isSearching={isSearching}
        />

        <ExploreResults
          results={searchResults}
          isSearching={isSearching}
          error={searchError}
          hasSearched={hasSearched}
          onPageChange={handlePageChange}
          onRetry={() => triggerSearch(query, documentType, currentPage)}
        />
      </section>

      {/* ── 5. Thematic Governance Pillars ── */}
      <ExploreDomainGrid />

      {/* ── 6. State Geography Profiles ── */}
      <ExploreGeography
        gisOptions={gisOptions}
        isLoading={isGisLoading}
        error={gisError}
      />

      {/* ── 7. Featured Published Statutes ── */}
      <ExploreFeaturedContent
        documents={featuredDocs}
        isLoading={isFeaturedLoading}
        error={featuredError}
      />

      {/* ── 8. AI Assistant Banner ── */}
      <ExploreAssistantCta />
    </div>
  );
}
