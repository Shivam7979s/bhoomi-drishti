import { useState, useEffect } from 'react';
import {
  AlertCircle,
  Calendar,
  FileText,
  Globe,
  Landmark,
  Lock,
  Plus,
  RefreshCw,
  Scale,
  Shield,
  Trash2,
  User,
  X,
} from 'lucide-react';
import {
  fetchProjectSnapshots,
  fetchSnapshotEvidence,
  unlinkSnapshotEvidence,
} from '../../governance/services/governanceService';
import { GovernanceEvidenceLinkModal } from '../../governance/components/GovernanceEvidenceLinkModal';
import { GovernanceSnapshotModal } from '../../governance/components/GovernanceSnapshotModal';
import type {
  GovernanceEvidenceType,
  GovernanceIndicatorEvidenceResponse,
  GovernanceIndicatorSnapshotResponse,
  GovernanceSummaryIndicatorItemResponse,
} from '../../governance/types/governance';

interface ProjectGovernanceSnapshotsTabProps {
  projectId: string;
  canContribute: boolean;
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

export function ProjectGovernanceSnapshotsTab({
  projectId,
  canContribute,
}: ProjectGovernanceSnapshotsTabProps) {
  const [snapshots, setSnapshots] = useState<GovernanceIndicatorSnapshotResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCaptureModal, setShowCaptureModal] = useState<boolean>(false);
  const [snapshotForEvidenceLink, setSnapshotForEvidenceLink] = useState<GovernanceIndicatorSnapshotResponse | null>(null);

  // Evidence inspector drawer state
  const [inspectingSnapshot, setInspectingSnapshot] = useState<GovernanceIndicatorSnapshotResponse | null>(null);
  const [evidenceList, setEvidenceList] = useState<GovernanceIndicatorEvidenceResponse[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState<boolean>(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  async function loadSnapshots() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjectSnapshots(projectId);
      setSnapshots(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load governance snapshots for this project.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSnapshots();
  }, [projectId]);

  // Load evidence whenever inspectingSnapshot changes
  useEffect(() => {
    if (!inspectingSnapshot) {
      setEvidenceList([]);
      return;
    }

    let active = true;
    async function loadEvidence() {
      setLoadingEvidence(true);
      try {
        const evidence = await fetchSnapshotEvidence(inspectingSnapshot!.id);
        if (active) setEvidenceList(evidence);
      } catch (err) {
        console.error('Failed to load snapshot evidence', err);
      } finally {
        if (active) setLoadingEvidence(false);
      }
    }
    loadEvidence();

    return () => {
      active = false;
    };
  }, [inspectingSnapshot]);

  async function handleUnlinkEvidence(evidenceId: string) {
    if (!inspectingSnapshot) return;
    if (!window.confirm('Are you sure you want to unlink this statutory evidence record from the snapshot?')) return;

    setUnlinkingId(evidenceId);
    try {
      await unlinkSnapshotEvidence(inspectingSnapshot.id, evidenceId);
      setEvidenceList((prev) => prev.filter((e) => e.id !== evidenceId));
      // Update snapshot evidence count in list
      setSnapshots((prev) =>
        prev.map((s) =>
          s.id === inspectingSnapshot.id
            ? { ...s, evidenceCount: Math.max(0, s.evidenceCount - 1) }
            : s,
        ),
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to unlink evidence');
    } finally {
      setUnlinkingId(null);
    }
  }

  // Fallback indicator item array for modal dropdown
  const defaultIndicators: GovernanceSummaryIndicatorItemResponse[] = [
    {
      indicatorCode: 'LAND_USE_AGRICULTURAL_AREA',
      indicatorName: 'Agricultural Land Area',
      category: 'LAND_USE',
      unit: 'SQ_METERS',
      aggregationMethod: 'SUM',
      numericValue: 0,
      denominator: null,
      breakdownJson: '{}',
      sourceDataTimestamp: new Date().toISOString(),
    },
    {
      indicatorCode: 'LAND_USE_COMMERCIAL_AREA',
      indicatorName: 'Commercial Land Area',
      category: 'LAND_USE',
      unit: 'SQ_METERS',
      aggregationMethod: 'SUM',
      numericValue: 0,
      denominator: null,
      breakdownJson: '{}',
      sourceDataTimestamp: new Date().toISOString(),
    },
    {
      indicatorCode: 'LAND_USE_RESIDENTIAL_AREA',
      indicatorName: 'Residential Land Area',
      category: 'LAND_USE',
      unit: 'SQ_METERS',
      aggregationMethod: 'SUM',
      numericValue: 0,
      denominator: null,
      breakdownJson: '{}',
      sourceDataTimestamp: new Date().toISOString(),
    },
    {
      indicatorCode: 'OWNERSHIP_PRIVATE_RATIO',
      indicatorName: 'Private Ownership Ratio',
      category: 'OWNERSHIP',
      unit: 'PERCENTAGE',
      aggregationMethod: 'PERCENTAGE_SHARE',
      numericValue: 0,
      denominator: null,
      breakdownJson: '{}',
      sourceDataTimestamp: new Date().toISOString(),
    },
    {
      indicatorCode: 'OWNERSHIP_GOVERNMENT_RATIO',
      indicatorName: 'Government Land Ratio',
      category: 'OWNERSHIP',
      unit: 'PERCENTAGE',
      aggregationMethod: 'PERCENTAGE_SHARE',
      numericValue: 0,
      denominator: null,
      breakdownJson: '{}',
      sourceDataTimestamp: new Date().toISOString(),
    },
    {
      indicatorCode: 'STATUS_DISPUTED_RATIO',
      indicatorName: 'Cadastral Dispute Density',
      category: 'STATUS_DISTRIBUTION',
      unit: 'PERCENTAGE',
      aggregationMethod: 'PERCENTAGE_SHARE',
      numericValue: 0,
      denominator: null,
      breakdownJson: '{}',
      sourceDataTimestamp: new Date().toISOString(),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Landmark className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Project Governance Audits & Statutory Evidence
              </h2>
            </div>
            <p className="mt-1 max-w-3xl text-xs text-slate-600">
              Immutable point-in-time calculation snapshots and statutory legal citations bound to this project dossier.
              Snapshots establish an authoritative audit baseline without altering underlying spatial records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadSnapshots}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
              Refresh
            </button>

            {canContribute && (
              <button
                type="button"
                onClick={() => setShowCaptureModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Capture Audit Snapshot
              </button>
            )}
          </div>
        </div>

        {/* Methodology notice: LIVE vs IMMUTABLE SNAPSHOT */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
            <Scale className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-blue-950">Statutory Evidence Standard</span>
              Candidate research documents and circulars become official statutory evidence only when explicitly linked by an authorized project investigator or official.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 flex items-start gap-2.5">
            <Shield className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-slate-900">Immutable Audit Baseline</span>
              Snapshots capture the exact calculated values as of the timestamp. Linking or unlinking evidence attaches provenance notes but never modifies the persisted calculation.
            </div>
          </div>
        </div>
      </div>

      {/* Snapshots Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 italic rounded-2xl border border-slate-200 bg-white shadow-xs">
          Loading project audit snapshots...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
          <h3 className="text-sm font-bold">Failed to Load Project Governance Snapshots</h3>
          <p className="mt-1 text-xs text-rose-700">{error}</p>
          <button
            type="button"
            onClick={loadSnapshots}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      ) : snapshots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Landmark className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Governance Snapshots Captured Yet</h3>
          <p className="mt-1 max-w-md mx-auto text-xs text-slate-500">
            Audit snapshots allow project members to freeze indicator calculations for regulatory compliance, environmental clearances, and legal filings.
          </p>
          {canContribute && (
            <button
              type="button"
              onClick={() => setShowCaptureModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Capture First Audit Snapshot
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Indicator</th>
                  <th scope="col" className="px-5 py-3.5">Audit Baseline Value</th>
                  <th scope="col" className="px-5 py-3.5">Snapshot Timestamp</th>
                  <th scope="col" className="px-5 py-3.5">Visibility</th>
                  <th scope="col" className="px-5 py-3.5">Statutory Evidence</th>
                  <th scope="col" className="px-5 py-3.5">Captured By</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {snapshots.map((snap) => (
                  <tr key={snap.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{snap.indicatorName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{snap.indicatorCode}</div>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {snap.unit === 'PERCENTAGE'
                        ? `${snap.numericValue.toFixed(2)}%`
                        : snap.numericValue.toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] font-normal text-slate-500">{snap.unit}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{new Date(snap.asOf).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[10px] font-bold border ${
                        snap.visibility === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {snap.visibility === 'PUBLISHED' ? (
                          <>
                            <Globe className="h-3 w-3 text-emerald-600" />
                            PUBLISHED
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3 text-slate-500" />
                            INTERNAL
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-800 border border-purple-200">
                        <FileText className="h-3.5 w-3.5 text-purple-600" />
                        {snap.evidenceCount} linked statutory items
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>{snap.generatedByName || 'Project Member'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => setInspectingSnapshot(snap)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-purple-50 hover:text-purple-800 hover:border-purple-200 transition"
                      >
                        <FileText className="h-3.5 w-3.5 text-purple-600" />
                        <span>View Evidence</span>
                      </button>

                      {canContribute && (
                        <button
                          type="button"
                          onClick={() => setSnapshotForEvidenceLink(snap)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Link Evidence</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EVIDENCE INSPECTION DRAWER */}
      {inspectingSnapshot && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition">
          <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                    <Scale className="h-4 w-4" />
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">
                    Linked Statutory Evidence
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Audit Snapshot for <strong className="text-slate-700">{inspectingSnapshot.indicatorName}</strong>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                    Value: {inspectingSnapshot.numericValue} {inspectingSnapshot.unit}
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                    As Of: {new Date(inspectingSnapshot.asOf).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingSnapshot(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingEvidence ? (
                <div className="py-12 text-center text-xs text-slate-400 italic">
                  Retrieving linked statutory evidence dossier...
                </div>
              ) : evidenceList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                  <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No statutory evidence linked to this snapshot.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Authorized members can link research documents and administrative circulars using the "Link Evidence" button.
                  </p>
                  {canContribute && (
                    <button
                      type="button"
                      onClick={() => {
                        const snap = inspectingSnapshot;
                        setInspectingSnapshot(null);
                        setSnapshotForEvidenceLink(snap);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Link Evidence Now
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
                    <span>{evidenceList.length} Linked Legal & Statutory Records</span>
                    <span className="font-semibold text-emerald-700">Legally Bound to Snapshot</span>
                  </div>

                  {evidenceList.map((item) => {
                    const badge = EVIDENCE_TYPE_LABELS[item.evidenceType] || {
                      label: item.evidenceType,
                      color: 'text-slate-700',
                      bgColor: 'bg-slate-50 border-slate-200',
                    };

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${badge.bgColor} ${badge.color}`}
                            >
                              <Scale className="h-3 w-3" />
                              {badge.label}
                            </span>
                            <h4 className="mt-1 text-xs font-bold text-slate-900">
                              {item.documentTitle || item.sectionTitle || 'Statutory Evidence Reference'}
                            </h4>
                          </div>

                          {canContribute && (
                            <button
                              type="button"
                              onClick={() => handleUnlinkEvidence(item.id)}
                              disabled={unlinkingId === item.id}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition"
                              title="Unlink evidence"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {item.chunkText && (
                          <p className="mt-1 font-mono text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                            {item.chunkText}
                          </p>
                        )}

                        {item.rationale && (
                          <div className="mt-2 text-xs text-slate-700 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/60">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block mb-0.5">
                              Statutory Relevance / Rationale:
                            </span>
                            {item.rationale}
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            {item.sectionTitle && (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-mono">
                                Sec: {item.sectionTitle}
                              </span>
                            )}
                            {item.pageNumber && (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-mono">
                                Page: {item.pageNumber}
                              </span>
                            )}
                          </div>
                          <span>
                            Linked by {item.linkedByName || 'Project Member'} on{' '}
                            {new Date(item.linkedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Audited via BHOOMI-DRISHTI Governance Framework
              </span>
              <button
                type="button"
                onClick={() => setInspectingSnapshot(null)}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-100 transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAPTURE SNAPSHOT MODAL */}
      <GovernanceSnapshotModal
        isOpen={showCaptureModal}
        onClose={() => setShowCaptureModal(false)}
        onSuccess={(created) => {
          setSnapshots((prev) => [created, ...prev]);
        }}
        scopeType="PROJECT"
        projectId={projectId}
        indicators={defaultIndicators}
      />

      {/* LINK STATUTORY EVIDENCE MODAL */}
      <GovernanceEvidenceLinkModal
        isOpen={!!snapshotForEvidenceLink}
        onClose={() => setSnapshotForEvidenceLink(null)}
        onSuccess={() => {
          setSnapshots((prev) =>
            prev.map((s) =>
              s.id === snapshotForEvidenceLink?.id
                ? { ...s, evidenceCount: s.evidenceCount + 1 }
                : s,
            ),
          );
          setSnapshotForEvidenceLink(null);
        }}
        snapshot={snapshotForEvidenceLink}
      />
    </div>
  );
}
