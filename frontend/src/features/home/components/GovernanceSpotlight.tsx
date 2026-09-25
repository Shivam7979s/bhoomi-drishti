import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, CheckCircle2, History, Landmark } from 'lucide-react';
import type { GovernanceIndicatorDefinitionResponse } from '../../governance/types/governance';

interface GovernanceSpotlightProps {
  indicators: GovernanceIndicatorDefinitionResponse[];
  isLoading: boolean;
  error: string | null;
}

// Fallback capability definitions when backend is connecting
const FALLBACK_INDICATORS: GovernanceIndicatorDefinitionResponse[] = [
  {
    id: 'ind-1',
    code: 'LAND_USE_DISTRIBUTION',
    name: 'Land Use Classification Distribution',
    category: 'LAND_USE',
    unit: 'PERCENTAGE',
    aggregationMethod: 'PERCENTAGE_SHARE',
    sourceDomain: 'CADASTRAL_RECORDS',
    calculationVersion: '1.0',
    description: 'Tracks spatial distribution across agricultural, residential, commercial, industrial, and forest zoning classifications.',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ind-2',
    code: 'OWNERSHIP_TYPE_SHARE',
    name: 'Cadastral Ownership Type Breakdown',
    category: 'OWNERSHIP',
    unit: 'PERCENTAGE',
    aggregationMethod: 'PERCENTAGE_SHARE',
    sourceDomain: 'CADASTRAL_RECORDS',
    calculationVersion: '1.0',
    description: 'Measures tenure proportions across individual, joint, government, community, and institutionally held parcels.',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ind-3',
    code: 'DISPUTE_STATUS_RATIO',
    name: 'Disputed Parcel Status Distribution',
    category: 'STATUS_DISTRIBUTION',
    unit: 'PERCENTAGE',
    aggregationMethod: 'PERCENTAGE_SHARE',
    sourceDomain: 'CADASTRAL_RECORDS',
    calculationVersion: '1.0',
    description: 'Tracks proportion of active, disputed, inactive, and pending-verification parcels across administrative circles.',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

export function GovernanceSpotlight({
  indicators,
  isLoading,
  error,
}: GovernanceSpotlightProps) {
  const displayIndicators = indicators.length > 0 ? indicators.slice(0, 3) : FALLBACK_INDICATORS;

  return (
    <section aria-labelledby="governance-spotlight-heading" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-slate-100">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900 border border-emerald-200/80">
              <Landmark className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
              <span>Administrative Transparency</span>
            </div>
            <h2 id="governance-spotlight-heading" className="text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
              State Revenue Governance Indicator Framework
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Standardized statutory indicators defined across state, district, and tehsil jurisdictions to structure
              mutation velocity, dispute resolution rates, and cadastral vector digitization methodologies.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/governance"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-900 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              <span>Open Dashboard</span>
            </Link>
            <Link
              to="/governance/compare"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <History className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <span>Audit History</span>
            </Link>
          </div>
        </div>

        {/* Indicators Cards Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {isLoading ? (
            // Loading Skeletons
            [1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-4">
                <div className="h-4 w-28 bg-slate-200 rounded" />
                <div className="h-6 w-4/5 bg-slate-200 rounded" />
                <div className="h-14 w-full bg-slate-200 rounded" />
                <div className="h-8 w-24 bg-slate-200 rounded" />
              </div>
            ))
          ) : (
            displayIndicators.map((ind) => (
              <div
                key={ind.code}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/40 p-6 shadow-2xs hover:border-slate-300 hover:bg-white transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-slate-200/70 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700 uppercase">
                        {ind.code}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">Definition</span>
                    </div>
                    <span className="rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-900 uppercase">
                      {ind.category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {ind.name}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {ind.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                    <span>Unit: <strong>{ind.unit.replace(/_/g, ' ')}</strong></span>
                  </div>

                  <Link
                    to={`/governance?indicator=${encodeURIComponent(ind.code)}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800">
            <span>Note: Displaying indicator framework specifications. Live district and tehsil metric calculations require operational backend connectivity.</span>
          </div>
        )}
      </div>
    </section>
  );
}
