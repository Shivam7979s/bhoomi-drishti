import { Filter, RotateCcw, X } from 'lucide-react';
import type { GisFilterOptions, GisFilterParams } from '../types/gis';
import { useLanguage } from '../../../context/LanguageContext';

export interface GisFilterPanelProps {
  filterOptions: GisFilterOptions | null;
  filters: GisFilterParams;
  onFilterChange: (newFilters: Partial<GisFilterParams>) => void;
  onResetFilters: () => void;
  isLoading?: boolean;
  onClose?: () => void;
}

export function GisFilterPanel({
  filterOptions,
  filters,
  onFilterChange,
  onResetFilters,
  isLoading,
  onClose,
}: GisFilterPanelProps) {
  const { t } = useLanguage();

  const hasActiveFilters = Boolean(
    filters.state ||
    filters.district ||
    filters.tehsil ||
    filters.village ||
    filters.landUseType ||
    filters.ownershipType ||
    filters.status
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-md space-y-4 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">{t.gisPage.filterBtn}</h2>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              disabled={isLoading}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-50 transition"
            >
              <RotateCcw className="h-3 w-3" />
              <span>{t.explorePage.resetFiltersBtn}</span>
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 text-xs">
        {/* State */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">State</label>
          <select
            value={filters.state || ''}
            onChange={(e) => onFilterChange({ state: e.target.value || undefined, district: undefined, tehsil: undefined, village: undefined })}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All States</option>
            {filterOptions?.states.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* District */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">District</label>
          <select
            value={filters.district || ''}
            onChange={(e) => onFilterChange({ district: e.target.value || undefined, tehsil: undefined, village: undefined })}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Districts</option>
            {filterOptions?.districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Tehsil */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">Tehsil</label>
          <select
            value={filters.tehsil || ''}
            onChange={(e) => onFilterChange({ tehsil: e.target.value || undefined, village: undefined })}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Tehsils</option>
            {filterOptions?.tehsils.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Village */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">Village</label>
          <select
            value={filters.village || ''}
            onChange={(e) => onFilterChange({ village: e.target.value || undefined })}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Villages</option>
            {filterOptions?.villages.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Land Use */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">Land Use Type</label>
          <select
            value={filters.landUseType || ''}
            onChange={(e) => onFilterChange({ landUseType: e.target.value || undefined })}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Land Uses</option>
            {filterOptions?.landUseTypes.map((lu) => (
              <option key={lu} value={lu}>{lu}</option>
            ))}
          </select>
        </div>

        {/* Ownership Type */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">Ownership Type</label>
          <select
            value={filters.ownershipType || ''}
            onChange={(e) => onFilterChange({ ownershipType: e.target.value || undefined })}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Ownership Types</option>
            {filterOptions?.ownershipTypes.map((ow) => (
              <option key={ow} value={ow}>{ow}</option>
            ))}
          </select>
        </div>

        {/* Record Status */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">Record Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ status: e.target.value || undefined })}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Permitted Statuses</option>
            {filterOptions?.statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
