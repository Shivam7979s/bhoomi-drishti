import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  FileText,
  Globe,
  Lock,
  Plus,
  RefreshCw,
  Scale,
  Shield,
  User,
} from 'lucide-react';
import { fetchProjectSnapshots, fetchScopeSnapshots } from '../services/governanceService';
import type {
  GovernanceIndicatorSnapshotResponse,
  GovernanceScopeType,
} from '../types/governance';

interface GovernanceSnapshotAuditListProps {
  scopeType: GovernanceScopeType;
  state?: string;
  district?: string;
  tehsil?: string;
  village?: string;
  projectId?: string;
  canContribute: boolean;
  onSelectSnapshotForEvidence: (snapshot: GovernanceIndicatorSnapshotResponse) => void;
  onOpenLinkEvidenceModal: (snapshot: GovernanceIndicatorSnapshotResponse) => void;
}

export function GovernanceSnapshotAuditList({
  scopeType,
  state,
  district,
  tehsil,
  village,
  projectId,
  canContribute,
  onSelectSnapshotForEvidence,
  onOpenLinkEvidenceModal,
}: GovernanceSnapshotAuditListProps) {
  const [snapshots, setSnapshots] = useState<GovernanceIndicatorSnapshotResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshots = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: GovernanceIndicatorSnapshotResponse[] = [];
      if (scopeType === 'PROJECT' && projectId) {
        data = await fetchProjectSnapshots(projectId);
      } else {
        data = await fetchScopeSnapshots({
          scopeType,
          state: state || undefined,
          district: district || undefined,
          tehsil: tehsil || undefined,
          village: village || undefined,
        });
      }
      setSnapshots(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load scope snapshots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshots();
  }, [scopeType, state, district, tehsil, village, projectId]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="border-b border-slate-100 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-blue-50 text-blue-700">
              <Shield className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Immutable Audit Snapshots Archive</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified, historical calculation snapshots and statutory evidence records for this scope
          </p>
        </div>

        <button
          type="button"
          onClick={loadSnapshots}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
          <span>Refresh Archive</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 italic">
          Loading immutable audit snapshots for {scopeType}...
        </div>
      ) : error ? (
        <div className="p-6 text-center text-xs text-rose-600">
          {error}
        </div>
      ) : snapshots.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 space-y-2">
          <p className="font-semibold text-slate-700">No audit snapshots have been captured for this administrative scope yet.</p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Authorized Officials and Researchers can capture a point-in-time calculation baseline using the "Capture Audit Snapshot" button above.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th scope="col" className="px-4 py-3">Indicator</th>
                <th scope="col" className="px-4 py-3">Frozen Value</th>
                <th scope="col" className="px-4 py-3">Snapshot Timestamp</th>
                <th scope="col" className="px-4 py-3">Visibility</th>
                <th scope="col" className="px-4 py-3">Statutory Evidence</th>
                <th scope="col" className="px-4 py-3">Captured By</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {snapshots.map((snap) => (
                <tr key={snap.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-900">{snap.indicatorName}</div>
                    <div className="text-[10px] font-mono text-slate-400">{snap.indicatorCode}</div>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    {snap.unit === 'PERCENTAGE'
                      ? `${snap.numericValue.toFixed(2)}%`
                      : snap.numericValue.toLocaleString('en-IN')}{' '}
                    <span className="text-[10px] font-normal text-slate-500">{snap.unit}</span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>{new Date(snap.asOf).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
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
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-800 border border-purple-200">
                      <FileText className="h-3 w-3 text-purple-600" />
                      {snap.evidenceCount} linked statutory items
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-slate-400" />
                      <span>{snap.generatedByName || 'Official'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-2">
                    <Link
                      to={`/governance/compare?${new URLSearchParams({
                        baseline: snap.id,
                        scopeType,
                        ...(state ? { state } : {}),
                        ...(district ? { district } : {}),
                        ...(tehsil ? { tehsil } : {}),
                        ...(village ? { village } : {}),
                        ...(projectId ? { projectId } : {}),
                      }).toString()}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-semibold text-indigo-800 shadow-2xs hover:bg-indigo-100 transition"
                      title="Compare this snapshot against another snapshot or LIVE"
                    >
                      <Scale className="h-3 w-3 text-indigo-600" />
                      <span>Compare</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => onSelectSnapshotForEvidence(snap)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-purple-50 hover:text-purple-800 hover:border-purple-200 transition"
                    >
                      <FileText className="h-3 w-3 text-purple-600" />
                      <span>View Evidence</span>
                    </button>
                    {canContribute && (
                      <button
                        type="button"
                        onClick={() => onOpenLinkEvidenceModal(snap)}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Link Evidence</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
