import { useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart2, PieChart as PieIcon } from 'lucide-react';
import {
  extractStatusSummary,
  parseBreakdownMap,
  toBreakdownChartData,
} from '../services/governanceService';
import type {
  BreakdownChartDatum,
  GovernanceSummaryIndicatorItemResponse,
  StatusDistributionSummary,
} from '../types/governance';

interface GovernanceBreakdownSectionProps {
  indicators: GovernanceSummaryIndicatorItemResponse[];
}

const PALETTE = [
  '#059669', // emerald-600
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#d97706', // amber-600
  '#0891b2', // cyan-600
  '#dc2626', // rose-600
  '#475569', // slate-600
  '#4f46e5', // indigo-600
  '#0d9488', // teal-600
  '#9333ea', // purple-600
  '#ea580c', // orange-600
  '#65a30d', // lime-600
];

export function GovernanceBreakdownSection({ indicators }: GovernanceBreakdownSectionProps) {
  // Metric toggles for Land Use and Ownership (Area vs. Parcel Count)
  const [landUseMetric, setLandUseMetric] = useState<'area' | 'count'>('area');
  const [landUseView, setLandUseView] = useState<'bar' | 'donut'>('bar');

  const [ownershipMetric, setOwnershipMetric] = useState<'area' | 'count'>('area');
  const [ownershipView, setOwnershipView] = useState<'bar' | 'donut'>('bar');

  // Locate relevant indicators
  const areaByLandUse = indicators.find((i) => i.indicatorCode === 'AREA_BY_LAND_USE');
  const countByLandUse = indicators.find((i) => i.indicatorCode === 'PARCEL_COUNT_BY_LAND_USE');

  const areaByOwnership = indicators.find((i) => i.indicatorCode === 'AREA_BY_OWNERSHIP');
  const countByOwnership = indicators.find((i) => i.indicatorCode === 'PARCEL_COUNT_BY_OWNERSHIP');

  // Parse breakdown maps
  const landUseBreakdown = parseBreakdownMap(
    landUseMetric === 'area' ? areaByLandUse?.breakdownJson : countByLandUse?.breakdownJson,
  );
  const landUseData: BreakdownChartDatum[] = toBreakdownChartData(
    landUseBreakdown,
    landUseMetric === 'area' ? 'SQ_METERS' : 'COUNT',
  );

  const ownershipBreakdown = parseBreakdownMap(
    ownershipMetric === 'area' ? areaByOwnership?.breakdownJson : countByOwnership?.breakdownJson,
  );
  const ownershipData: BreakdownChartDatum[] = toBreakdownChartData(
    ownershipBreakdown,
    ownershipMetric === 'area' ? 'SQ_METERS' : 'COUNT',
  );

  // Status distribution
  const statusSummary: StatusDistributionSummary = extractStatusSummary(indicators);

  return (
    <div className="space-y-6">
      {/* Cadastral Status Distribution Bar */}
      <StatusDistributionBanner summary={statusSummary} />

      {/* Side-by-side Breakdowns: Land Use & Ownership */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Land Use Distribution Card */}
        <DistributionCard
          title="Land Use Distribution"
          subtitle="Cadastral classification across evaluated boundary"
          metric={landUseMetric}
          viewMode={landUseView}
          data={landUseData}
          onMetricChange={setLandUseMetric}
          onViewModeChange={setLandUseView}
        />

        {/* Ownership Distribution Card */}
        <DistributionCard
          title="Ownership Distribution"
          subtitle="Titleholding & tenure distribution"
          metric={ownershipMetric}
          viewMode={ownershipView}
          data={ownershipData}
          onMetricChange={setOwnershipMetric}
          onViewModeChange={setOwnershipView}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Helper Subcomponents
// =============================================================================

interface DistributionCardProps {
  title: string;
  subtitle: string;
  metric: 'area' | 'count';
  viewMode: 'bar' | 'donut';
  data: BreakdownChartDatum[];
  onMetricChange: (m: 'area' | 'count') => void;
  onViewModeChange: (v: 'bar' | 'donut') => void;
}

function DistributionCard({
  title,
  subtitle,
  metric,
  viewMode,
  data,
  onMetricChange,
  onViewModeChange,
}: DistributionCardProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        <div className="mt-8 flex flex-col items-center justify-center text-center text-slate-400 py-10">
          <p className="text-xs">No distribution breakdown data returned for this scope.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      {/* Card Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Metric Selector (Area / Count) */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onMetricChange('area')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                metric === 'area'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Area (m²)
            </button>
            <button
              type="button"
              onClick={() => onMetricChange('count')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                metric === 'count'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Parcels
            </button>
          </div>

          {/* Chart View Toggle (Bar / Donut) */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              title="Bar Chart"
              onClick={() => onViewModeChange('bar')}
              className={`p-1 rounded-md transition ${
                viewMode === 'bar'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Donut Chart"
              onClick={() => onViewModeChange('donut')}
              className={`p-1 rounded-md transition ${
                viewMode === 'donut'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <PieIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'bar' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#64748b' }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={`bar-cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {data.map((_, index) => (
                  <Cell key={`donut-cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Accessible Full Category Legend without Data Truncation */}
      <div className="mt-4 max-h-36 overflow-y-auto border-t border-slate-100 pt-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {data.map((item, idx) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
              />
              <span className="truncate text-slate-600" title={`${item.name}: ${item.formattedValue}`}>
                {item.name}:{' '}
                <span className="font-semibold text-slate-800">
                  {item.percentage !== undefined ? `${item.percentage}%` : item.formattedValue}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: any[];
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (active && payload && payload.length) {
    const datum = payload[0].payload as BreakdownChartDatum;
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-xs">
        <div className="font-bold text-slate-900">{datum.name}</div>
        <div className="mt-1 text-slate-600 space-y-0.5">
          <div>
            Total: <span className="font-semibold text-slate-800">{datum.formattedValue}</span>
          </div>
          {datum.percentage !== undefined && (
            <div>
              Share: <span className="font-semibold text-slate-800">{datum.percentage}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

function StatusDistributionBanner({ summary }: { summary: StatusDistributionSummary }) {
  const { activeParcels, disputedParcels, pendingVerificationParcels, inactiveParcels, totalParcels } =
    summary;

  const activePct = totalParcels > 0 ? (activeParcels / totalParcels) * 100 : 0;
  const disputedPct = totalParcels > 0 ? (disputedParcels / totalParcels) * 100 : 0;
  const pendingPct = totalParcels > 0 ? (pendingVerificationParcels / totalParcels) * 100 : 0;
  const inactivePct = totalParcels > 0 ? (inactiveParcels / totalParcels) * 100 : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Cadastral Parcel Status Distribution</h3>
          <p className="text-xs text-slate-500">
            Authoritative status composition of evaluated land records
          </p>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total Evaluated: <span className="font-bold text-slate-800">{totalParcels.toLocaleString('en-IN')}</span> parcels
        </div>
      </div>

      {/* Segmented Status Bar */}
      <div className="h-4 w-full rounded-full bg-slate-100 flex overflow-hidden">
        {activePct > 0 && (
          <div
            style={{ width: `${activePct}%` }}
            className="bg-emerald-500 transition-all duration-300"
            title={`Active: ${activeParcels} (${activePct.toFixed(1)}%)`}
          />
        )}
        {disputedPct > 0 && (
          <div
            style={{ width: `${disputedPct}%` }}
            className="bg-rose-500 transition-all duration-300"
            title={`Disputed: ${disputedParcels} (${disputedPct.toFixed(1)}%)`}
          />
        )}
        {pendingPct > 0 && (
          <div
            style={{ width: `${pendingPct}%` }}
            className="bg-amber-400 transition-all duration-300"
            title={`Pending: ${pendingVerificationParcels} (${pendingPct.toFixed(1)}%)`}
          />
        )}
        {inactivePct > 0 && (
          <div
            style={{ width: `${inactivePct}%` }}
            className="bg-slate-400 transition-all duration-300"
            title={`Inactive: ${inactiveParcels} (${inactivePct.toFixed(1)}%)`}
          />
        )}
      </div>

      {/* Legend / Status Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-slate-600">
            Active:{' '}
            <strong className="text-slate-900">
              {activeParcels.toLocaleString('en-IN')} ({activePct.toFixed(1)}%)
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-500 shrink-0" />
          <span className="text-slate-600">
            Disputed:{' '}
            <strong className="text-slate-900">
              {disputedParcels.toLocaleString('en-IN')} ({disputedPct.toFixed(1)}%)
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-400 shrink-0" />
          <span className="text-slate-600">
            Pending:{' '}
            <strong className="text-slate-900">
              {pendingVerificationParcels.toLocaleString('en-IN')} ({pendingPct.toFixed(1)}%)
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-400 shrink-0" />
          <span className="text-slate-600">
            Inactive:{' '}
            <strong className="text-slate-900">
              {inactiveParcels.toLocaleString('en-IN')} ({inactivePct.toFixed(1)}%)
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
