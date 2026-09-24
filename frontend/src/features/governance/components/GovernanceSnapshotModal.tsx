import { useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Database,
  Globe,
  Lock,
  Shield,
  X,
} from 'lucide-react';
import { createSnapshot } from '../services/governanceService';
import type {
  CreateGovernanceSnapshotRequest,
  GovernanceIndicatorSnapshotResponse,
  GovernanceScopeType,
  GovernanceSummaryIndicatorItemResponse,
  SnapshotVisibility,
} from '../types/governance';

interface GovernanceSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (snapshot: GovernanceIndicatorSnapshotResponse) => void;
  scopeType: GovernanceScopeType;
  state?: string;
  district?: string;
  tehsil?: string;
  village?: string;
  projectId?: string;
  indicators: GovernanceSummaryIndicatorItemResponse[];
  initialIndicatorCode?: string;
}

export function GovernanceSnapshotModal({
  isOpen,
  onClose,
  onSuccess,
  scopeType,
  state,
  district,
  tehsil,
  village,
  projectId,
  indicators,
  initialIndicatorCode,
}: GovernanceSnapshotModalProps) {
  const [selectedCode, setSelectedCode] = useState<string>(
    initialIndicatorCode || indicators[0]?.indicatorCode || '',
  );
  const [visibility, setVisibility] = useState<SnapshotVisibility>('INTERNAL');
  const [sourceDataVersion, setSourceDataVersion] = useState<string>('cadastral-v1');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeIndicator = indicators.find((i) => i.indicatorCode === selectedCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCode) return;

    setLoading(true);
    setError(null);

    const payload: CreateGovernanceSnapshotRequest = {
      indicatorCode: selectedCode,
      scopeType,
      state: state || null,
      district: district || null,
      tehsil: tehsil || null,
      village: village || null,
      projectId: projectId || null,
      visibility,
      asOf: new Date().toISOString(),
      sourceDataVersion: sourceDataVersion.trim() || undefined,
    };

    try {
      const created = await createSnapshot(payload);
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create governance snapshot. Please check role permissions.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
      role="dialog"
      aria-labelledby="snapshot-modal-title"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Camera className="h-5 w-5" />
            </span>
            <div>
              <h2 id="snapshot-modal-title" className="text-sm font-bold text-slate-900">
                Capture Immutable Audit Snapshot
              </h2>
              <p className="text-[11px] text-slate-500">
                Persist a verified point-in-time calculation baseline
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Semantics Notice: LIVE vs. IMMUTABLE SNAPSHOT */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-bold">
              <Shield className="h-4 w-4 text-blue-700" />
              <span>Immutable Governance Baseline Semantics</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Unlike <strong>LIVE</strong> dashboard calculations (which reflect live cadastral record state),
              an <strong>IMMUTABLE SNAPSHOT</strong> freezes the deterministic calculation result at this exact second.
              Future parcel updates or statutory evidence links will <em>not</em> overwrite this audit baseline.
            </p>
          </div>

          {/* Indicator Selector */}
          <div className="space-y-1.5">
            <label htmlFor="snapshot-indicator-select" className="font-semibold text-slate-800">
              Indicator to Snapshot
            </label>
            <select
              id="snapshot-indicator-select"
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-hidden"
              required
            >
              {indicators.map((ind) => (
                <option key={ind.indicatorCode} value={ind.indicatorCode}>
                  {ind.indicatorName} ({ind.indicatorCode})
                </option>
              ))}
            </select>
            {activeIndicator && (
              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
                <span>Current Live Value: <strong>{activeIndicator.numericValue} {activeIndicator.unit}</strong></span>
                <span>Category: {activeIndicator.category}</span>
              </div>
            )}
          </div>

          {/* Target Administrative Scope Preview */}
          <div className="space-y-1.5">
            <span className="font-semibold text-slate-800">Evaluated Scope</span>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-700 flex items-center gap-2">
              <Database className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-900">{scopeType}</span>
                {state && <span> · {state}</span>}
                {district && <span> › {district}</span>}
                {tehsil && <span> › {tehsil}</span>}
                {village && <span> › {village}</span>}
                {projectId && <span> · Project UUID: {projectId}</span>}
              </div>
            </div>
          </div>

          {/* Visibility Options */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800">Snapshot Visibility</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('INTERNAL')}
                className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                  visibility === 'INTERNAL'
                    ? 'border-emerald-600 bg-emerald-50/40 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Lock className={`h-4 w-4 mt-0.5 shrink-0 ${visibility === 'INTERNAL' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="font-bold text-xs">INTERNAL</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Officials & Project Members only
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('PUBLISHED')}
                className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                  visibility === 'PUBLISHED'
                    ? 'border-emerald-600 bg-emerald-50/40 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Globe className={`h-4 w-4 mt-0.5 shrink-0 ${visibility === 'PUBLISHED' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="font-bold text-xs">PUBLISHED</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Publicly auditable by researchers
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Source Data Version Tag */}
          <div className="space-y-1.5">
            <label htmlFor="snapshot-version-input" className="font-semibold text-slate-800">
              Source Cadastral Version / Milestone Tag
            </label>
            <input
              id="snapshot-version-input"
              type="text"
              value={sourceDataVersion}
              onChange={(e) => setSourceDataVersion(e.target.value)}
              placeholder="e.g. cadastral-v1, Q3-2026-audit"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-hidden font-mono"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedCode}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Calculating & Freezing...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Freeze & Persist Snapshot</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
