import { useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  Globe,
  Lock,
  Radio,
  RefreshCw,
  Scale,
  Sparkles,
} from 'lucide-react';
import type {
  GovernanceIndicatorSnapshotResponse,
} from '../types/governance';

interface GovernanceComparisonSelectorProps {
  snapshots: GovernanceIndicatorSnapshotResponse[];
  loadingSnapshots: boolean;
  baselineSnapshotId: string;
  targetSnapshotId: string;
  compareToLive: boolean;
  onBaselineChange: (id: string) => void;
  onTargetChange: (id: string) => void;
  onCompareToLiveChange: (val: boolean) => void;
  onCompare: () => void;
  isComparing: boolean;
  onRefreshSnapshots?: () => void;
}

export function GovernanceComparisonSelector({
  snapshots,
  loadingSnapshots,
  baselineSnapshotId,
  targetSnapshotId,
  compareToLive,
  onBaselineChange,
  onTargetChange,
  onCompareToLiveChange,
  onCompare,
  isComparing,
  onRefreshSnapshots,
}: GovernanceComparisonSelectorProps) {
  // Indicator filter for usability: allows narrowing down candidate list
  const [selectedIndicatorCode, setSelectedIndicatorCode] = useState<string>('ALL');

  // Distinct indicators among available snapshots
  const availableIndicators = useMemo(() => {
    const map = new Map<string, string>();
    for (const snap of snapshots) {
      if (!map.has(snap.indicatorCode)) {
        map.set(snap.indicatorCode, snap.indicatorName);
      }
    }
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [snapshots]);

  // Filtered snapshot candidates
  const filteredSnapshots = useMemo(() => {
    if (selectedIndicatorCode === 'ALL') return snapshots;
    return snapshots.filter((s) => s.indicatorCode === selectedIndicatorCode);
  }, [snapshots, selectedIndicatorCode]);

  // Find selected baseline snapshot
  const baselineSnapshot = useMemo(() => {
    return snapshots.find((s) => s.id === baselineSnapshotId);
  }, [snapshots, baselineSnapshotId]);

  // Target candidates: only from same indicator for best UX usability
  const targetCandidates = useMemo(() => {
    if (!baselineSnapshot) return filteredSnapshots;
    return snapshots.filter((s) => s.indicatorCode === baselineSnapshot.indicatorCode && s.id !== baselineSnapshot.id);
  }, [snapshots, baselineSnapshot, filteredSnapshots]);

  const canCompare = Boolean(
    baselineSnapshotId &&
    (compareToLive || (targetSnapshotId && targetSnapshotId !== baselineSnapshotId)) &&
    !isComparing
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
      {/* Top Bar: Title & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Scale className="h-4 w-4 text-indigo-600" />
            Comparison Target Selection
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a verified audit baseline snapshot and compare against a target snapshot or the active cadastral state.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {availableIndicators.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs">
              <label htmlFor="indicator-filter" className="text-slate-500 font-medium">
                Filter Indicator:
              </label>
              <select
                id="indicator-filter"
                value={selectedIndicatorCode}
                onChange={(e) => setSelectedIndicatorCode(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Available ({availableIndicators.length})</option>
                {availableIndicators.map((ind) => (
                  <option key={ind.code} value={ind.code}>
                    {ind.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {onRefreshSnapshots && (
            <button
              type="button"
              onClick={onRefreshSnapshots}
              disabled={loadingSnapshots}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              title="Refresh candidate snapshots"
            >
              <RefreshCw className={`h-3 w-3 ${loadingSnapshots ? 'animate-spin text-indigo-600' : 'text-slate-400'}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {loadingSnapshots ? (
        <div className="py-8 text-center text-xs text-slate-400 italic">
          Loading archived snapshots for this scope...
        </div>
      ) : snapshots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">No audit snapshots found for this administrative scope.</p>
          <p className="text-slate-400">
            Create at least one point-in-time snapshot on the Governance Analytics Dashboard before running a comparison.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pairwise Selection Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column: Baseline Milestone */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white">
                    1
                  </span>
                  Baseline Audit Snapshot
                </span>
                {baselineSnapshot && (
                  <span className="text-[11px] font-mono text-slate-500">
                    {baselineSnapshot.indicatorCode}
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="baseline-select" className="block text-[11px] font-medium text-slate-600 mb-1">
                  Select Baseline Snapshot:
                </label>
                <select
                  id="baseline-select"
                  value={baselineSnapshotId}
                  onChange={(e) => onBaselineChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Baseline Snapshot --</option>
                  {filteredSnapshots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.indicatorName} — {new Date(s.asOf).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })} ({s.numericValue} {s.unit})
                    </option>
                  ))}
                </select>
              </div>

              {baselineSnapshot && (
                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>{baselineSnapshot.indicatorName}</span>
                    <span className="font-mono text-indigo-700">
                      {baselineSnapshot.numericValue.toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] text-slate-500 font-normal">{baselineSnapshot.unit}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>{new Date(baselineSnapshot.asOf).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>Engine v{baselineSnapshot.calculationVersion}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {baselineSnapshot.visibility === 'PUBLISHED' ? (
                        <>
                          <Globe className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-700 font-medium">Published</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3 text-slate-500" />
                          <span className="text-slate-600 font-medium">Internal</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3 text-purple-600" />
                      <span>{baselineSnapshot.evidenceCount} statutory citations</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Target Comparison Milestone */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-700 text-[10px] font-bold text-white">
                    2
                  </span>
                  Comparison Target
                </span>

                {/* Mode Selector Buttons */}
                <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => onCompareToLiveChange(false)}
                    className={`rounded-md px-2.5 py-1 font-semibold transition ${
                      !compareToLive
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Historical Snapshot
                  </button>
                  <button
                    type="button"
                    onClick={() => onCompareToLiveChange(true)}
                    className={`rounded-md px-2.5 py-1 font-semibold transition ${
                      compareToLive
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Current LIVE
                  </button>
                </div>
              </div>

              {compareToLive ? (
                /* Mode B: Live Target Card */
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                      <Radio className="h-2.5 w-2.5 animate-pulse" />
                      LIVE
                    </span>
                    <span className="font-bold text-emerald-950">Active Cadastral Aggregations</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Comparison will calculate variance between the historical baseline snapshot and the real-time
                    postGIS aggregations evaluated over the current cadastral land records for this jurisdiction.
                  </p>
                </div>
              ) : (
                /* Mode A: Snapshot Target Dropdown */
                <>
                  <div>
                    <label htmlFor="target-select" className="block text-[11px] font-medium text-slate-600 mb-1">
                      Select Target Snapshot:
                    </label>
                    <select
                      id="target-select"
                      value={targetSnapshotId}
                      onChange={(e) => onTargetChange(e.target.value)}
                      disabled={!baselineSnapshotId}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <option value="">-- Choose Target Snapshot --</option>
                      {targetCandidates.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.indicatorName} — {new Date(s.asOf).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })} ({s.numericValue} {s.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  {targetSnapshotId && (
                    <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2 text-xs">
                      {(() => {
                        const targetSnap = snapshots.find((s) => s.id === targetSnapshotId);
                        if (!targetSnap) return null;
                        return (
                          <>
                            <div className="flex items-center justify-between font-semibold text-slate-900">
                              <span>{targetSnap.indicatorName}</span>
                              <span className="font-mono text-indigo-700">
                                {targetSnap.numericValue.toLocaleString('en-IN')}{' '}
                                <span className="text-[10px] text-slate-500 font-normal">{targetSnap.unit}</span>
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                <span>{new Date(targetSnap.asOf).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-slate-400" />
                                <span>Engine v{targetSnap.calculationVersion}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {targetSnap.visibility === 'PUBLISHED' ? (
                                  <>
                                    <Globe className="h-3 w-3 text-emerald-600" />
                                    <span className="text-emerald-700 font-medium">Published</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="h-3 w-3 text-slate-500" />
                                    <span className="text-slate-600 font-medium">Internal</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3 text-purple-600" />
                                <span>{targetSnap.evidenceCount} statutory citations</span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={onCompare}
              disabled={!canCompare}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition ${
                canCompare
                  ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed text-slate-500'
              }`}
            >
              {isComparing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Calculating Variance...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Execute Temporal Comparison</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
