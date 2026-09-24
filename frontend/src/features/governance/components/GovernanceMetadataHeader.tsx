import { Calendar, CheckCircle2, Clock, Cpu, MapPin } from 'lucide-react';
import type { GovernanceScopeSummaryResponse } from '../types/governance';

interface GovernanceMetadataHeaderProps {
  scope: GovernanceScopeSummaryResponse;
  summaryMode: string;
  calculationVersion: string;
  generatedAt: string;
  sourceDataTimestamp: string;
  totalIndicatorsEvaluated: number;
}

function formatTimestamp(isoString?: string | null): string {
  if (!isoString) return 'Current';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function GovernanceMetadataHeader({
  scope,
  summaryMode,
  calculationVersion,
  generatedAt,
  sourceDataTimestamp,
  totalIndicatorsEvaluated,
}: GovernanceMetadataHeaderProps) {
  // Build clean hierarchical scope breadcrumb
  const scopeBreadcrumbs: string[] = [];
  if (scope.state) scopeBreadcrumbs.push(scope.state);
  if (scope.district) scopeBreadcrumbs.push(scope.district);
  if (scope.tehsil) scopeBreadcrumbs.push(scope.tehsil);
  if (scope.village) scopeBreadcrumbs.push(scope.village);
  if (scope.scopeType === 'PROJECT') {
    scopeBreadcrumbs.push(scope.projectName ? `Project: ${scope.projectName}` : `Project: ${scope.projectId}`);
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Scope Identity */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200 uppercase tracking-wide">
            <MapPin className="h-3 w-3 text-emerald-600" />
            {scope.scopeType} Scope
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            {summaryMode}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
            <Cpu className="h-3 w-3 text-slate-500" />
            v{calculationVersion}
          </span>
        </div>

        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {scopeBreadcrumbs.length > 0 ? scopeBreadcrumbs.join(' \u203A ') : 'Administrative Summary'}
        </h1>
      </div>

      {/* Freshness & Evaluation Details */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5">
        <div>
          <div className="flex items-center gap-1 text-slate-500 mb-0.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Record Freshness (PostgreSQL):</span>
          </div>
          <div className="font-semibold text-slate-800">
            {formatTimestamp(sourceDataTimestamp)}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 text-slate-500 mb-0.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Generated At:</span>
          </div>
          <div className="font-semibold text-slate-800">
            {formatTimestamp(generatedAt)}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 text-slate-500 mb-0.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Evaluated:</span>
          </div>
          <div className="font-semibold text-slate-800">
            {totalIndicatorsEvaluated} Indicators
          </div>
        </div>
      </div>
    </div>
  );
}
