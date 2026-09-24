import { BookOpen, Calendar, ChevronRight } from 'lucide-react';
import type { GovernanceSummaryIndicatorItemResponse } from '../types/governance';

interface GovernanceIndicatorsTableProps {
  indicators: GovernanceSummaryIndicatorItemResponse[];
  onSelectIndicator?: (indicator: GovernanceSummaryIndicatorItemResponse) => void;
}

function formatValue(value: number, unit: string): string {
  if (unit === 'PERCENTAGE') {
    return `${value.toFixed(2)}%`;
  }
  if (unit === 'SQ_METERS') {
    const ha = (value / 10000).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    return `${value.toLocaleString('en-IN', { maximumFractionDigits: 1 })} m² (${ha} ha)`;
  }
  return value.toLocaleString('en-IN');
}

function formatDenominator(denom: number | null, unit: string): string {
  if (denom == null) return '\u2014';
  if (unit === 'PERCENTAGE' || unit === 'SQ_METERS') {
    const ha = (denom / 10000).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    return `${denom.toLocaleString('en-IN', { maximumFractionDigits: 1 })} m² (${ha} ha)`;
  }
  return denom.toLocaleString('en-IN');
}

function formatTimestamp(isoString?: string | null): string {
  if (!isoString) return '\u2014';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  LAND_USE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OWNERSHIP: 'bg-blue-50 text-blue-700 border-blue-200',
  STATUS_DISTRIBUTION: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function GovernanceIndicatorsTable({ indicators, onSelectIndicator }: GovernanceIndicatorsTableProps) {
  if (indicators.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-xs">
        No indicators evaluated for this scope selection.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="border-b border-slate-100 p-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Evaluated Governance Indicators</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic indicator calculations evaluated against authoritative cadastral land records
          </p>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          Select an indicator to inspect legal definitions & linked statutory evidence
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th scope="col" className="px-4 py-3">
                Indicator
              </th>
              <th scope="col" className="px-4 py-3">
                Category
              </th>
              <th scope="col" className="px-4 py-3">
                Value
              </th>
              <th scope="col" className="px-4 py-3">
                Denominator
              </th>
              <th scope="col" className="px-4 py-3">
                Unit
              </th>
              <th scope="col" className="px-4 py-3">
                Aggregation
              </th>
              <th scope="col" className="px-4 py-3">
                Record Timestamp
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Statutory Provenance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {indicators.map((ind) => (
              <tr
                key={ind.indicatorCode}
                onClick={() => onSelectIndicator?.(ind)}
                className="hover:bg-emerald-50/40 transition cursor-pointer group"
              >
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-slate-900 group-hover:text-emerald-900 transition">
                    {ind.indicatorName}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">{ind.indicatorCode}</div>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                      CATEGORY_COLORS[ind.category] || 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {ind.category.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-bold text-slate-900">
                  {formatValue(ind.numericValue, ind.unit)}
                </td>
                <td className="px-4 py-3.5 text-slate-600">
                  {formatDenominator(ind.denominator, ind.unit)}
                </td>
                <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                  {ind.unit}
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    {ind.aggregationMethod}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span>{formatTimestamp(ind.sourceDataTimestamp)}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectIndicator?.(ind);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Methodology & Evidence</span>
                    <ChevronRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
