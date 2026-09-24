import { AlertCircle, CheckCircle2, Layers, Maximize, PieChart, ShieldAlert } from 'lucide-react';
import { extractDominantCategory, parseBreakdownMap } from '../services/governanceService';
import type { GovernanceSummaryIndicatorItemResponse } from '../types/governance';

interface GovernanceKpiCardsProps {
  indicators: GovernanceSummaryIndicatorItemResponse[];
}

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-IN');
}

function formatArea(sqm: number | null | undefined): { sqm: string; ha: string } {
  if (sqm === null || sqm === undefined) return { sqm: '0.00', ha: '0.00' };
  const val = Number(sqm);
  const sqmStr = val.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const haVal = (val / 10000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return { sqm: sqmStr, ha: haVal };
}

export function GovernanceKpiCards({ indicators }: GovernanceKpiCardsProps) {
  // Find indicator items from response
  const parcelCountItem = indicators.find((i) => i.indicatorCode === 'PARCEL_COUNT_BY_LAND_USE');
  const areaItem = indicators.find((i) => i.indicatorCode === 'AREA_BY_LAND_USE');
  const landUseShareItem = indicators.find((i) => i.indicatorCode === 'LAND_USE_SHARE');
  const ownershipShareItem = indicators.find((i) => i.indicatorCode === 'OWNERSHIP_SHARE');
  const activeCountItem = indicators.find((i) => i.indicatorCode === 'ACTIVE_PARCEL_COUNT');
  const disputedCountItem = indicators.find((i) => i.indicatorCode === 'DISPUTED_PARCEL_COUNT');

  // Derive dominant categories strictly as presentation transformation from parsed breakdownJson
  let dominantLandUse = 'N/A';
  let dominantLandUseSubtext = 'No data';
  if (landUseShareItem?.breakdownJson) {
    const parsed = parseBreakdownMap(landUseShareItem.breakdownJson);
    const top = extractDominantCategory(parsed);
    if (top) {
      dominantLandUse = `${top.name}`;
      dominantLandUseSubtext = `${top.formatted}% of evaluated area`;
    }
  }

  let dominantOwnership = 'N/A';
  let dominantOwnershipSubtext = 'No data';
  if (ownershipShareItem?.breakdownJson) {
    const parsed = parseBreakdownMap(ownershipShareItem.breakdownJson);
    const top = extractDominantCategory(parsed);
    if (top) {
      dominantOwnership = `${top.name}`;
      dominantOwnershipSubtext = `${top.formatted}% of evaluated area`;
    }
  }

  const totalParcels = parcelCountItem?.numericValue ?? activeCountItem?.denominator ?? 0;
  const totalArea = formatArea(areaItem?.numericValue ?? 0);
  const activeParcels = activeCountItem?.numericValue ?? 0;
  const disputedParcels = disputedCountItem?.numericValue ?? 0;

  const activeRatio =
    totalParcels > 0 ? `${((activeParcels / totalParcels) * 100).toFixed(1)}% of total` : '0% of total';
  const disputeRatio =
    totalParcels > 0 ? `${((disputedParcels / totalParcels) * 100).toFixed(1)}% dispute rate` : '0% dispute rate';

  const cards = [
    {
      title: 'Total Parcels',
      value: formatNumber(totalParcels),
      subtext: 'Authoritative cadastral boundary records',
      icon: Layers,
      color: 'text-slate-700',
      bgColor: 'bg-slate-100',
    },
    {
      title: 'Total Cadastral Area',
      value: `${totalArea.ha} ha`,
      subtext: `${totalArea.sqm} m² evaluated`,
      icon: Maximize,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Dominant Land Use',
      value: dominantLandUse,
      subtext: dominantLandUseSubtext,
      icon: PieChart,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Dominant Ownership',
      value: dominantOwnership,
      subtext: dominantOwnershipSubtext,
      icon: PieChart,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Active Parcels',
      value: formatNumber(activeParcels),
      subtext: activeRatio,
      icon: CheckCircle2,
      color: 'text-teal-700',
      bgColor: 'bg-teal-50',
    },
    {
      title: 'Disputed Parcels',
      value: formatNumber(disputedParcels),
      subtext: disputeRatio,
      icon: disputedParcels > 0 ? ShieldAlert : AlertCircle,
      color: disputedParcels > 0 ? 'text-amber-700' : 'text-slate-700',
      bgColor: disputedParcels > 0 ? 'bg-amber-50' : 'bg-slate-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.title}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:shadow-sm transition"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                {c.title}
              </span>
              <span className={`p-1.5 rounded-lg shrink-0 ${c.bgColor} ${c.color}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold tracking-tight text-slate-900 truncate">{c.value}</div>
              <div className="mt-0.5 text-[11px] text-slate-500 truncate">{c.subtext}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
