import { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Calendar,
  Clock,
  FileText,
  Info,
  Radio,
  Scale,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  GovernanceComparisonResponse,
  GovernanceEvidenceType,
  GovernanceIndicatorEvidenceResponse,
} from '../types/governance';

interface GovernanceComparisonViewProps {
  comparison: GovernanceComparisonResponse;
}

const EVIDENCE_TYPE_STYLES: Record<
  GovernanceEvidenceType,
  { label: string; badgeClass: string }
> = {
  STATUTORY_BENCHMARK: {
    label: 'Statutory Benchmark',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  ADMINISTRATIVE_CIRCULAR: {
    label: 'Administrative Circular',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  AUDIT_PRECEDENT: {
    label: 'Audit Precedent',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  METHODOLOGICAL_STANDARD: {
    label: 'Methodological Standard',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  POLICY_FRAMEWORK: {
    label: 'Policy Framework',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
  },
};

export function GovernanceComparisonView({ comparison }: GovernanceComparisonViewProps) {
  const {
    indicatorName,
    indicatorCode,
    category,
    unit,
    scopeType,
    state,
    district,
    tehsil,
    village,
    baseline,
    target,
    quantitativeVariance,
    breakdownVariances,
    evidenceDelta,
    calculationVersionMismatch,
    elapsedDays,
    chronologicalReversal,
  } = comparison;

  // Active evidence sub-tab: 'common' | 'added' | 'removed'
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<'added' | 'removed' | 'common'>('added');

  // Format scope hierarchy for display
  const scopeHierarchyText = [state, district, tehsil, village].filter(Boolean).join(' › ') || scopeType;

  // Prepare chart data for breakdown comparison
  const breakdownChartData = breakdownVariances.map((item) => ({
    name: item.key.replace(/_/g, ' '),
    baseline: item.baselineValue ?? 0,
    target: item.targetValue ?? 0,
    baselinePresent: item.baselineValue !== null,
    targetPresent: item.targetValue !== null,
  }));

  const activeEvidenceList: GovernanceIndicatorEvidenceResponse[] =
    activeEvidenceTab === 'added'
      ? evidenceDelta.addedEvidence
      : activeEvidenceTab === 'removed'
      ? evidenceDelta.removedEvidence
      : evidenceDelta.commonEvidence;

  return (
    <div className="space-y-6">
      {/* 1. Temporal Warnings & Notices */}
      {chronologicalReversal && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block">Chronological Reversal Notice:</strong>
            The selected target snapshot timestamp predates the baseline snapshot. The calculated mathematical deltas represent a reverse chronological audit (&Delta; = Prior Snapshot &minus; Recent Baseline).
          </div>
        </div>
      )}

      {calculationVersionMismatch && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-950 flex items-start gap-3 shadow-2xs">
          <Info className="h-4 w-4 text-indigo-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block">Calculation Algorithm Version Discrepancy:</strong>
            The baseline milestone was evaluated with engine v{baseline.calculationVersion}, whereas the target milestone was evaluated with engine v{target.calculationVersion}. Variations may reflect methodology refinements in addition to cadastral changes.
          </div>
        </div>
      )}

      {/* 2. Top Overview & Metadata Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                {indicatorCode}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {category.replace(/_/g, ' ')} &bull; {scopeType}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">{indicatorName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Administrative Scope: <span className="font-semibold text-slate-700">{scopeHierarchyText}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <Link
              to={
                baseline.snapshotId && target.snapshotId
                  ? `/assistant?contextType=GOVERNANCE_COMPARISON&comparisonBaseSnapshotId=${encodeURIComponent(baseline.snapshotId)}&comparisonTargetSnapshotId=${encodeURIComponent(target.snapshotId)}&indicatorCode=${encodeURIComponent(indicatorCode)}&contextTitle=${encodeURIComponent(`Comparison: ${indicatorName}`)}`
                  : `/assistant?contextType=GOVERNANCE_INDICATOR&indicatorCode=${encodeURIComponent(indicatorCode)}&contextTitle=${encodeURIComponent(indicatorName)}`
              }
              aria-label={`Explain variance for indicator ${indicatorName} with AI Assistant`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 px-3 py-1 font-semibold text-white shadow-2xs transition focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <Bot className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Explain Variance with Assistant</span>
            </Link>
            {elapsedDays !== null && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{Math.abs(elapsedDays)} Days Elapsed</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/60 px-3 py-1 font-semibold text-indigo-800">
              <Scale className="h-3.5 w-3.5 text-indigo-600" />
              <span>Unit: {unit}</span>
            </span>
          </div>
        </div>

        {/* 3. Milestone Comparison & Quantitative Deltas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Baseline Milestone Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Baseline Milestone
            </span>
            <div className="text-xl font-bold font-mono text-slate-900">
              {unit === 'PERCENTAGE'
                ? `${baseline.numericValue.toFixed(2)}%`
                : baseline.numericValue.toLocaleString('en-IN')}{' '}
              <span className="text-xs font-normal text-slate-500">{unit}</span>
            </div>
            {baseline.denominator !== null && (
              <p className="text-[11px] text-slate-500">
                Denominator: {baseline.denominator.toLocaleString('en-IN')}
              </p>
            )}
            <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                {new Date(baseline.asOf).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="font-mono text-[10px] text-slate-400">v{baseline.calculationVersion}</span>
            </div>
          </div>

          {/* Variance Metric Card (Strictly Neutral Directionality) */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block">
              Quantitative Variance (&Delta; = Target &minus; Baseline)
            </span>
            <div className="text-xl font-bold font-mono text-slate-900">
              {quantitativeVariance.absoluteDelta > 0
                ? `+${quantitativeVariance.absoluteDelta.toLocaleString('en-IN')}`
                : quantitativeVariance.absoluteDelta.toLocaleString('en-IN')}{' '}
              <span className="text-xs font-normal text-slate-600">{unit}</span>
            </div>
            <div className="text-[11px] text-slate-600 space-y-0.5">
              <div>
                Relative Change:{' '}
                {quantitativeVariance.percentageChangeDefined && quantitativeVariance.percentageChange !== null ? (
                  <span className="font-semibold font-mono text-slate-800">
                    {quantitativeVariance.percentageChange > 0
                      ? `+${quantitativeVariance.percentageChange.toFixed(2)}%`
                      : `${quantitativeVariance.percentageChange.toFixed(2)}%`}
                  </span>
                ) : (
                  <span className="italic text-slate-400">Undefined (Zero Baseline)</span>
                )}
              </div>
              {quantitativeVariance.denominatorDelta !== null && (
                <div>
                  Denominator &Delta;:{' '}
                  <span className="font-semibold font-mono text-slate-800">
                    {quantitativeVariance.denominatorDelta > 0
                      ? `+${quantitativeVariance.denominatorDelta.toLocaleString('en-IN')}`
                      : quantitativeVariance.denominatorDelta.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-indigo-100 flex items-center justify-between">
              <span>Interpretation:</span>
              <span className="font-mono font-semibold uppercase text-slate-600">
                {quantitativeVariance.trendDirection}
              </span>
            </div>
          </div>

          {/* Target Milestone Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Target Milestone
              </span>
              {target.isLive && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                  <Radio className="h-2 w-2 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <div className="text-xl font-bold font-mono text-slate-900">
              {unit === 'PERCENTAGE'
                ? `${target.numericValue.toFixed(2)}%`
                : target.numericValue.toLocaleString('en-IN')}{' '}
              <span className="text-xs font-normal text-slate-500">{unit}</span>
            </div>
            {target.denominator !== null && (
              <p className="text-[11px] text-slate-500">
                Denominator: {target.denominator.toLocaleString('en-IN')}
              </p>
            )}
            <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                {target.isLive
                  ? 'Real-Time State'
                  : new Date(target.asOf).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
              </span>
              <span className="font-mono text-[10px] text-slate-400">v{target.calculationVersion}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Categorical Breakdown Variance Analysis */}
      {breakdownVariances.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-600" />
                Categorical Distribution Variance
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed comparison of sub-category parcel counts and distributions. Missing categories remain distinct from zero.
              </p>
            </div>
          </div>

          {/* Side-by-Side Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={breakdownChartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  tick={{ fill: '#475569' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tick={{ fill: '#475569' }}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    Number(val).toLocaleString('en-IN'),
                    name === 'baseline' ? 'Baseline Milestone' : 'Target Milestone',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Legend
                  formatter={(value) => (value === 'baseline' ? 'Baseline' : 'Target')}
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                />
                <Bar dataKey="baseline" fill="#64748B" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="target" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown Variance Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-4 py-2.5">Category Key</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Baseline Value</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Target Value</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Absolute &Delta;</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Relative Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {breakdownVariances.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-900">
                      {item.key.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-700">
                      {item.baselineValue !== null ? (
                        item.baselineValue.toLocaleString('en-IN')
                      ) : (
                        <span className="font-sans italic text-slate-400">
                          {item.baselineRawValue ? item.baselineRawValue : '— (Not Present)'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-700">
                      {item.targetValue !== null ? (
                        item.targetValue.toLocaleString('en-IN')
                      ) : (
                        <span className="font-sans italic text-slate-400">
                          {item.targetRawValue ? item.targetRawValue : '— (Not Present)'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                      {item.delta !== null ? (
                        item.delta > 0 ? `+${item.delta.toLocaleString('en-IN')}` : item.delta.toLocaleString('en-IN')
                      ) : (
                        <span className="font-sans font-normal italic text-slate-400">
                          {item.baselineValue === null ? '— (New)' : '— (Discontinued)'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                      {item.percentageChangeDefined && item.percentageChange !== null ? (
                        item.percentageChange > 0
                          ? `+${item.percentageChange.toFixed(2)}%`
                          : `${item.percentageChange.toFixed(2)}%`
                      ) : (
                        <span className="font-sans font-normal italic text-slate-400">
                          {item.baselineValue === null || item.targetValue === null ? '—' : 'N/A (Zero Base)'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Statutory Evidence Provenance Delta */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              Statutory Evidence & Provenance Variance
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Audit analysis of statutory benchmarks, circulars, and methodological references associated with each snapshot.
            </p>
          </div>

          {/* Neutral Category Differentiators (NO good/bad colors) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveEvidenceTab('added')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition border ${
                activeEvidenceTab === 'added'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Introduced in Target ({evidenceDelta.addedEvidenceCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveEvidenceTab('removed')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition border ${
                activeEvidenceTab === 'removed'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Superseded / Not in Target ({evidenceDelta.removedEvidenceCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveEvidenceTab('common')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition border ${
                activeEvidenceTab === 'common'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Retained in Both ({evidenceDelta.commonEvidenceCount})
            </button>
          </div>
        </div>

        {/* Evidence List */}
        {activeEvidenceList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            No statutory citations in this provenance category.
          </div>
        ) : (
          <div className="space-y-3">
            {activeEvidenceList.map((item) => {
              const style = EVIDENCE_TYPE_STYLES[item.evidenceType] || {
                label: item.evidenceType,
                badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
              };

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${style.badgeClass}`}>
                        {style.label}
                      </span>
                      <span className="font-bold text-slate-900">
                        {item.documentTitle || 'Statutory Citation Document'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      {item.pageNumber && <span>Page {item.pageNumber}</span>}
                      {item.sectionTitle && <span>§ {item.sectionTitle}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {new Date(item.linkedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {item.rationale && (
                    <p className="text-[11px] text-slate-600 italic bg-white/70 rounded-lg p-2.5 border border-slate-200/60">
                      "{item.rationale}"
                    </p>
                  )}

                  {item.chunkText && (
                    <div className="text-[11px] text-slate-600 bg-white rounded-lg p-2.5 border border-slate-200/60 font-mono text-[10px] whitespace-pre-wrap">
                      {item.chunkText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
