import { Building2, Filter, FolderKanban, Globe, Lock, MapPin, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import type { Project } from '../../collaboration/types';
import type { GisFilterOptions } from '../../gis/types/gis';
import type { GovernanceScopeType, IndicatorCategory } from '../types/governance';

interface GovernanceScopeSelectorProps {
  scopeType: GovernanceScopeType;
  state: string;
  district: string;
  tehsil: string;
  village: string;
  projectId: string;
  category: IndicatorCategory | 'ALL';
  gisOptions: GisFilterOptions | null;
  accessibleProjects: Project[];
  loading: boolean;
  loadingOptions: boolean;
  isScopeValid: boolean;
  onScopeTypeChange: (type: GovernanceScopeType) => void;
  onStateChange: (state: string) => void;
  onDistrictChange: (district: string) => void;
  onTehsilChange: (tehsil: string) => void;
  onVillageChange: (village: string) => void;
  onProjectIdChange: (projectId: string) => void;
  onCategoryChange: (category: IndicatorCategory | 'ALL') => void;
  onRefresh: () => void;
}

const SCOPE_TABS: { type: GovernanceScopeType; label: string; icon: typeof Globe }[] = [
  { type: 'STATE', label: 'State', icon: Globe },
  { type: 'DISTRICT', label: 'District', icon: Building2 },
  { type: 'TEHSIL', label: 'Tehsil', icon: MapPin },
  { type: 'VILLAGE', label: 'Village', icon: MapPin },
  { type: 'PROJECT', label: 'Project', icon: FolderKanban },
];

const CATEGORY_FILTERS: { value: IndicatorCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Indicators' },
  { value: 'LAND_USE', label: 'Land Use' },
  { value: 'OWNERSHIP', label: 'Ownership' },
  { value: 'STATUS_DISTRIBUTION', label: 'Status Distribution' },
];

export function GovernanceScopeSelector({
  scopeType,
  state,
  district,
  tehsil,
  village,
  projectId,
  category,
  gisOptions,
  accessibleProjects,
  loading,
  loadingOptions,
  isScopeValid,
  onScopeTypeChange,
  onStateChange,
  onDistrictChange,
  onTehsilChange,
  onVillageChange,
  onProjectIdChange,
  onCategoryChange,
  onRefresh,
}: GovernanceScopeSelectorProps) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      {/* Top Header: Scope Type Tabs & Refresh Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
            Administrative Scope Selector
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate live deterministic governance metrics across administrative boundaries or research projects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Scope Type Segmented Tabs */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
            {SCOPE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = scopeType === tab.type;
              return (
                <button
                  key={tab.type}
                  type="button"
                  onClick={() => onScopeTypeChange(tab.type)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition ${
                    isActive
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || !isScopeValid}
            title="Refresh Live Evaluation"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-emerald-700 disabled:opacity-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Scope Hierarchy Controls */}
      {scopeType !== 'PROJECT' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* State (Always required for regional scope) */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">State *</label>
            <select
              value={state}
              onChange={(e) => onStateChange(e.target.value)}
              disabled={loadingOptions}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {gisOptions?.states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
              {!gisOptions && <option value="Madhya Pradesh">Madhya Pradesh</option>}
            </select>
          </div>

          {/* District (Required for DISTRICT, TEHSIL, VILLAGE) */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              District {['DISTRICT', 'TEHSIL', 'VILLAGE'].includes(scopeType) ? '*' : '(Disabled)'}
            </label>
            <select
              value={district}
              onChange={(e) => onDistrictChange(e.target.value)}
              disabled={scopeType === 'STATE'}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select District</option>
              {gisOptions?.districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Tehsil (Required for TEHSIL, VILLAGE) */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Tehsil {['TEHSIL', 'VILLAGE'].includes(scopeType) ? '*' : '(Disabled)'}
            </label>
            <select
              value={tehsil}
              onChange={(e) => onTehsilChange(e.target.value)}
              disabled={['STATE', 'DISTRICT'].includes(scopeType)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select Tehsil</option>
              {gisOptions?.tehsils.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Village (Required for VILLAGE) */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Village {scopeType === 'VILLAGE' ? '*' : '(Disabled)'}
            </label>
            <select
              value={village}
              onChange={(e) => onVillageChange(e.target.value)}
              disabled={['STATE', 'DISTRICT', 'TEHSIL'].includes(scopeType)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select Village</option>
              {gisOptions?.villages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        /* Project Scope Selection */
        <div className="text-xs">
          {isAuthenticated ? (
            <div className="space-y-3">
              <label className="block font-medium text-slate-700">Select Collaboration Project *</label>
              {accessibleProjects.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <select
                    value={projectId}
                    onChange={(e) => onProjectIdChange(e.target.value)}
                    className="w-full sm:max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Select an Accessible Project</option>
                    {accessibleProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.visibility})
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-400">or enter UUID:</span>
                  <input
                    type="text"
                    placeholder="Project UUID"
                    value={projectId}
                    onChange={(e) => onProjectIdChange(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-72"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-slate-600 mb-2">
                    No accessible projects found in your workspaces. You can enter a project ID manually or create a project in Collaboration Workspaces.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Enter Project UUID"
                      value={projectId}
                      onChange={(e) => onProjectIdChange(e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-80"
                    />
                    <Link
                      to="/workspaces"
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      Go to Workspaces &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-900">Authentication Required for Project Scope</h3>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Project-level governance summaries require member access authorized via CollaborationSecurityService.
                  </p>
                </div>
              </div>
              <Link
                to="/login"
                className="rounded-lg bg-amber-600 px-3.5 py-1.5 font-semibold text-white hover:bg-amber-700 transition shrink-0"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
        <span className="flex items-center gap-1 font-semibold text-slate-500 mr-1">
          <Filter className="h-3.5 w-3.5" />
          Filter:
        </span>
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => onCategoryChange(cat.value)}
            className={`rounded-full px-3 py-1 font-medium transition ${
              category === cat.value
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
