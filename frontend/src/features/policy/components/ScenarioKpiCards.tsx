import { BarChart3, AlertCircle, Maximize, CheckSquare, Layers, ShieldAlert, TrendingUp } from 'lucide-react';
import type { ScenarioResult, ScenarioMetrics } from '../types/policy';

interface ScenarioKpiCardsProps {
  result?: ScenarioResult | ScenarioMetrics | null;
  compact?: boolean;
}

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-IN');
}

function formatArea(sqm: number | null | undefined): { sqm: string; ha: string } {
  if (sqm === null || sqm === undefined) return { sqm: '0.00', ha: '0.00' };
  const val = Number(sqm);
  const sqmStr = val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const haVal = (val / 10000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return { sqm: sqmStr, ha: haVal };
}

export function ScenarioKpiCards({ result, compact = false }: ScenarioKpiCardsProps) {
  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-slate-500 text-sm">
        No simulation metrics available. Execute the scenario simulation to calculate impact metrics.
      </div>
    );
  }

  const affectedArea = formatArea(result.totalAreaAffectedSqm);
  const baselineArea = formatArea(result.baselineAreaSqm);
  const simulatedArea = formatArea(result.simulatedAreaSqm);
  const disputedArea = formatArea(result.disputedAreaSqm);

  const cards = [
    {
      label: 'Parcels Evaluated',
      value: formatNumber(result.totalParcelsEvaluated),
      subtext: 'Matching evaluation scope',
      icon: Layers,
      color: 'text-slate-700',
      bgColor: 'bg-slate-50',
    },
    {
      label: 'Parcels Affected',
      value: formatNumber(result.totalParcelsAffected),
      subtext: `${result.totalParcelsEvaluated ? ((result.totalParcelsAffected / result.totalParcelsEvaluated) * 100).toFixed(1) : 0}% of evaluated`,
      icon: CheckSquare,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Total Area Affected',
      value: `${affectedArea.sqm} m²`,
      subtext: `${affectedArea.ha} hectares`,
      icon: TrendingUp,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Baseline Evaluated Area',
      value: `${baselineArea.sqm} m²`,
      subtext: `${baselineArea.ha} hectares`,
      icon: Maximize,
      color: 'text-slate-700',
      bgColor: 'bg-slate-50',
    },
    {
      label: 'Simulated Land Area',
      value: `${simulatedArea.sqm} m²`,
      subtext: `${simulatedArea.ha} hectares`,
      icon: BarChart3,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
    },
    {
      label: 'Disputed Parcels',
      value: formatNumber(result.disputedParcelsCount),
      subtext: 'Flagged with dispute status',
      icon: AlertCircle,
      color: 'text-rose-700',
      bgColor: 'bg-rose-50',
    },
    {
      label: 'Disputed Area Exposure',
      value: `${disputedArea.sqm} m²`,
      subtext: `${disputedArea.ha} hectares`,
      icon: ShieldAlert,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
    },
  ];

  return (
    <div className={`grid gap-4 ${compact ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7'}`}>
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{c.label}</span>
              <span className={`p-1.5 rounded-lg ${c.bgColor} ${c.color}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold tracking-tight text-slate-900">{c.value}</div>
              <div className="mt-0.5 text-xs text-slate-500">{c.subtext}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
