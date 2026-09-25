import { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Bot,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Info,
  Scale,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  fetchIndicatorDefinition,
  fetchScopeSnapshots,
  fetchSnapshotEvidence,
} from '../services/governanceService';
import type {
  GovernanceEvidenceType,
  GovernanceIndicatorDefinitionResponse,
  GovernanceIndicatorEvidenceResponse,
  GovernanceIndicatorSnapshotResponse,
  GovernanceScopeType,
  GovernanceSummaryIndicatorItemResponse,
} from '../types/governance';

interface GovernanceIndicatorDetailDrawerProps {
  indicator: GovernanceSummaryIndicatorItemResponse | null;
  scopeType: GovernanceScopeType;
  state?: string;
  district?: string;
  tehsil?: string;
  village?: string;
  onClose: () => void;
}

const EVIDENCE_TYPE_LABELS: Record<GovernanceEvidenceType, { label: string; color: string; bgColor: string }> = {
  STATUTORY_BENCHMARK: {
    label: 'Statutory Benchmark',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  ADMINISTRATIVE_CIRCULAR: {
    label: 'Administrative Circular',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 border-purple-200',
  },
  AUDIT_PRECEDENT: {
    label: 'Audit Precedent',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
  },
  METHODOLOGICAL_STANDARD: {
    label: 'Methodological Standard',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50 border-teal-200',
  },
  POLICY_FRAMEWORK: {
    label: 'Policy Framework',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200',
  },
};

export function GovernanceIndicatorDetailDrawer({
  indicator,
  scopeType,
  state,
  district,
  tehsil,
  village,
  onClose,
}: GovernanceIndicatorDetailDrawerProps) {
  const [definition, setDefinition] = useState<GovernanceIndicatorDefinitionResponse | null>(null);
  const [snapshots, setSnapshots] = useState<GovernanceIndicatorSnapshotResponse[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [evidenceList, setEvidenceList] = useState<GovernanceIndicatorEvidenceResponse[]>([]);
  const [loadingDef, setLoadingDef] = useState<boolean>(false);
  const [loadingEvidence, setLoadingEvidence] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load definition when indicator changes
  useEffect(() => {
    if (!indicator) {
      setDefinition(null);
      setSnapshots([]);
      setEvidenceList([]);
      return;
    }

    let active = true;
    async function loadData() {
      setLoadingDef(true);
      setError(null);
      try {
        const def = await fetchIndicatorDefinition(indicator!.indicatorCode);
        if (active) setDefinition(def);

        // Check for snapshots for this indicator and scope
        const snaps = await fetchScopeSnapshots({
          scopeType,
          state: state || undefined,
          district: district || undefined,
          tehsil: tehsil || undefined,
          village: village || undefined,
          indicatorCode: indicator!.indicatorCode,
        });

        if (active) {
          setSnapshots(snaps);
          if (snaps.length > 0) {
            setSelectedSnapshotId(snaps[0].id);
          } else {
            setSelectedSnapshotId(null);
            setEvidenceList([]);
          }
        }
      } catch (err) {
        if (active) {
          console.warn('Failed to load indicator details:', err);
          setError('Failed to load statutory indicator definition or evidence.');
        }
      } finally {
        if (active) setLoadingDef(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [indicator, scopeType, state, district, tehsil, village]);

  // Load evidence when selected snapshot changes
  useEffect(() => {
    if (!selectedSnapshotId) {
      setEvidenceList([]);
      return;
    }

    let active = true;
    async function loadEvidence() {
      setLoadingEvidence(true);
      try {
        const evidence = await fetchSnapshotEvidence(selectedSnapshotId!);
        if (active) setEvidenceList(evidence);
      } catch (err) {
        if (active) {
          console.warn('Failed to load snapshot evidence:', err);
        }
      } finally {
        if (active) setLoadingEvidence(false);
      }
    }

    loadEvidence();
    return () => {
      active = false;
    };
  }, [selectedSnapshotId]);

  if (!indicator) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      aria-labelledby="drawer-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="border-b border-slate-200 px-6 py-5 flex items-start justify-between gap-4 bg-slate-50/70">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Statutory Definition Authority
                </span>
                <span className="inline-flex items-center rounded-md bg-slate-200/80 px-2 py-0.5 text-xs font-medium text-slate-700">
                  Version {definition?.calculationVersion || '1.0'}
                </span>
              </div>
              <h2 id="drawer-title" className="mt-2 text-lg font-bold text-slate-900">
                {indicator.indicatorName}
              </h2>
              <p className="text-xs font-mono text-slate-500 mt-0.5">{indicator.indicatorCode}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Current LIVE Metrics Context */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wide">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Current LIVE Evaluated Result ({scopeType})
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(indicator.sourceDataTimestamp).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {indicator.unit === 'PERCENTAGE'
                    ? `${indicator.numericValue.toFixed(1)}%`
                    : indicator.numericValue.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-medium text-slate-600">
                  {indicator.unit === 'SQ_METERS'
                    ? 'm² evaluated area'
                    : indicator.unit.toLowerCase()}
                </span>
                {indicator.denominator != null && (
                  <span className="text-xs text-slate-500 ml-1">
                    (Denominator: {indicator.denominator.toLocaleString('en-IN')})
                  </span>
                )}
              </div>
            </div>

            {/* Authoritative Indicator Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                Legal Description & Statutory Mandate
              </h3>
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-700 leading-relaxed">
                {loadingDef ? (
                  <p className="text-slate-400 italic">Loading authoritative definition...</p>
                ) : definition?.description ? (
                  <p>{definition.description}</p>
                ) : (
                  <p className="text-slate-500 italic">No formal statutory description recorded.</p>
                )}
              </div>
            </div>

            {/* Methodological Specifications Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-emerald-600" />
                Methodological Specifications
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Category</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{indicator.category}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Unit of Measurement</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{indicator.unit}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Aggregation Method</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{indicator.aggregationMethod}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Source Domain</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    {definition?.sourceDomain || 'LAND_RECORD'}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Calculation Engine</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">PostgreSQL / PostGIS</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Calculation Version</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    v{definition?.calculationVersion || '1.0'}
                  </div>
                </div>
              </div>
            </div>

            {/* Statutory Evidence & Provenance Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  Linked Statutory Evidence ({evidenceList.length})
                </h3>
                {snapshots.length > 1 && (
                  <select
                    value={selectedSnapshotId || ''}
                    onChange={(e) => setSelectedSnapshotId(e.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 font-medium"
                    aria-label="Select snapshot for evidence"
                  >
                    {snapshots.map((s, idx) => (
                      <option key={s.id} value={s.id}>
                        Audit Snapshot {idx + 1} ({new Date(s.asOf).toLocaleDateString('en-IN')})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {loadingEvidence ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  Loading verified statutory evidence items...
                </div>
              ) : evidenceList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center space-y-2">
                  <Info className="mx-auto h-6 w-6 text-slate-400" />
                  <p className="text-xs font-medium text-slate-600">
                    No statutory circulars or audit precedents have been formally linked to this indicator for this scope yet.
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Authorized Government Officials and Researchers can link legislative acts and administrative circulars through point-in-time audit snapshots.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {evidenceList.map((ev) => {
                    const badge = EVIDENCE_TYPE_LABELS[ev.evidenceType] || {
                      label: ev.evidenceType,
                      color: 'text-slate-700',
                      bgColor: 'bg-slate-50 border-slate-200',
                    };

                    return (
                      <div
                        key={ev.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs transition space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border ${badge.bgColor} ${badge.color}`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Linked statutory evidence · {badge.label}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(ev.linkedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        {ev.documentTitle && (
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                              {ev.documentTitle}
                            </h4>
                            {ev.researchDocumentId && (
                              <Link
                                to={`/research-documents/${ev.researchDocumentId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 shrink-0"
                              >
                                View Act / Circular
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        )}

                        {ev.chunkText && (
                          <blockquote className="rounded-lg bg-slate-50 border-l-2 border-emerald-500 p-2.5 text-[11px] text-slate-700 italic leading-relaxed">
                            "{ev.chunkText}"
                            {(ev.pageNumber != null || ev.sectionTitle) && (
                              <div className="not-italic text-[10px] text-slate-400 mt-1 font-sans">
                                {ev.sectionTitle && `Section: ${ev.sectionTitle}`}
                                {ev.pageNumber != null && ` (Page ${ev.pageNumber})`}
                              </div>
                            )}
                          </blockquote>
                        )}

                        {ev.rationale && (
                          <div className="text-[11px] text-slate-600">
                            <span className="font-semibold text-slate-700">Official Rationale:</span> {ev.rationale}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          <span>Linked by: {ev.linkedByName || 'Government Official'}</span>
                          {ev.similarityScore != null && (
                            <span>Relevance Match: {(ev.similarityScore * 100).toFixed(0)}%</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
            <Link
              to={
                selectedSnapshotId
                  ? `/assistant?contextType=GOVERNANCE_SNAPSHOT&snapshotId=${encodeURIComponent(selectedSnapshotId)}&indicatorCode=${encodeURIComponent(indicator.indicatorCode)}&contextTitle=${encodeURIComponent(indicator.indicatorName)}`
                  : `/assistant?contextType=GOVERNANCE_INDICATOR&indicatorCode=${encodeURIComponent(indicator.indicatorCode)}&contextTitle=${encodeURIComponent(indicator.indicatorName)}`
              }
              aria-label={selectedSnapshotId ? `Ask Assistant about snapshot for ${indicator.indicatorName}` : `Ask Assistant about indicator ${indicator.indicatorName}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <Bot className="h-4 w-4" aria-hidden="true" />
              <span>{selectedSnapshotId ? 'Ask Assistant about Snapshot' : 'Ask Assistant about Indicator'}</span>
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 shadow-2xs hover:bg-slate-100 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
