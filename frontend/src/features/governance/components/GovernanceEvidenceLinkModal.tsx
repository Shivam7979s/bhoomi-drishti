import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Shield,
  X,
} from 'lucide-react';
import { linkSnapshotEvidence } from '../services/governanceService';
import type {
  GovernanceEvidenceType,
  GovernanceIndicatorEvidenceResponse,
  GovernanceIndicatorSnapshotResponse,
  LinkGovernanceEvidenceRequest,
} from '../types/governance';

interface GovernanceEvidenceLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (evidence: GovernanceIndicatorEvidenceResponse) => void;
  snapshot: GovernanceIndicatorSnapshotResponse | null;
}

const EVIDENCE_TYPE_OPTIONS: { type: GovernanceEvidenceType; label: string; description: string }[] = [
  {
    type: 'STATUTORY_BENCHMARK',
    label: 'Statutory Benchmark',
    description: 'Legislative act or legal statute defining thresholds, mandates, or standards',
  },
  {
    type: 'ADMINISTRATIVE_CIRCULAR',
    label: 'Administrative Circular',
    description: 'Revenue department circular, government notification, or operational order',
  },
  {
    type: 'AUDIT_PRECEDENT',
    label: 'Audit Precedent',
    description: 'Auditor General report, judicial tribunal ruling, or formal inquiry record',
  },
  {
    type: 'METHODOLOGICAL_STANDARD',
    label: 'Methodological Standard',
    description: 'Survey of India or digital land governance technical computation standard',
  },
  {
    type: 'POLICY_FRAMEWORK',
    label: 'Policy Framework',
    description: 'National/State land governance policy whitepaper or guideline',
  },
];

export function GovernanceEvidenceLinkModal({
  isOpen,
  onClose,
  onSuccess,
  snapshot,
}: GovernanceEvidenceLinkModalProps) {
  const [evidenceType, setEvidenceType] = useState<GovernanceEvidenceType>('ADMINISTRATIVE_CIRCULAR');
  const [researchDocumentId, setResearchDocumentId] = useState<string>('');
  const [documentChunkId, setDocumentChunkId] = useState<string>('');
  const [rationale, setRationale] = useState<string>('');
  const [similarityScore, setSimilarityScore] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !snapshot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!researchDocumentId.trim() && !documentChunkId.trim()) {
      setError('Please provide at least a Research Document UUID or Document Chunk UUID.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload: LinkGovernanceEvidenceRequest = {
      evidenceType,
      researchDocumentId: researchDocumentId.trim() || undefined,
      documentChunkId: documentChunkId.trim() || undefined,
      rationale: rationale.trim() || undefined,
      similarityScore: similarityScore ? parseFloat(similarityScore) : undefined,
    };

    try {
      const created = await linkSnapshotEvidence(snapshot.id, payload);
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to link evidence. Please check that the document exists and is accessible.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
      role="dialog"
      aria-labelledby="evidence-link-modal-title"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-800">
              <LinkIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 id="evidence-link-modal-title" className="text-sm font-bold text-slate-900">
                Link Statutory Evidence to Snapshot
              </h2>
              <p className="text-[11px] text-slate-500">
                Attach legislative acts, circulars, or audit precedents
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

          {/* Snapshot Target Banner */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Target Audit Snapshot
            </div>
            <div className="font-bold text-slate-900 text-xs">
              {snapshot.indicatorName} ({snapshot.indicatorCode})
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>Frozen Value: <strong>{snapshot.numericValue} {snapshot.unit}</strong></span>
              <span>·</span>
              <span>As of: {new Date(snapshot.asOf).toLocaleDateString('en-IN')}</span>
              <span>·</span>
              <span className="font-mono text-[10px]">ID: {snapshot.id.slice(0, 8)}...</span>
            </div>
          </div>

          {/* Evidence Semantics Notice */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3.5 text-[11px] text-purple-900 leading-relaxed space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-purple-700" />
              <span>Evidence-First Verification Notice</span>
            </div>
            <p>
              Documents are considered <strong>Candidate evidence</strong> until an authorized Government Official
              or Researcher explicitly attaches them. Linking statutory evidence creates an auditable legal provenance
              linkage without modifying the underlying deterministic metric.
            </p>
          </div>

          {/* Evidence Type */}
          <div className="space-y-1.5">
            <label htmlFor="evidence-type-select" className="font-semibold text-slate-800">
              Evidence Type
            </label>
            <select
              id="evidence-type-select"
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value as GovernanceEvidenceType)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-hidden"
              required
            >
              {EVIDENCE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.type} value={opt.type}>
                  {opt.label} — {opt.description}
                </option>
              ))}
            </select>
          </div>

          {/* Research Document UUID */}
          <div className="space-y-1.5">
            <label htmlFor="evidence-doc-id-input" className="font-semibold text-slate-800">
              Research Document UUID
            </label>
            <input
              id="evidence-doc-id-input"
              type="text"
              value={researchDocumentId}
              onChange={(e) => setResearchDocumentId(e.target.value)}
              placeholder="e.g. 00000000-0000-0000-0000-000000000001"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-hidden font-mono"
            />
            <p className="text-[10px] text-slate-400">
              Copy UUID from any published statutory act, regulation, or circular in the Research Hub.
            </p>
          </div>

          {/* Document Chunk UUID (Optional) */}
          <div className="space-y-1.5">
            <label htmlFor="evidence-chunk-id-input" className="font-semibold text-slate-800">
              Document Chunk UUID <span className="font-normal text-slate-400">(Optional for exact section citation)</span>
            </label>
            <input
              id="evidence-chunk-id-input"
              type="text"
              value={documentChunkId}
              onChange={(e) => setDocumentChunkId(e.target.value)}
              placeholder="e.g. e9110000-0000-0000-0000-000000000001"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-hidden font-mono"
            />
          </div>

          {/* Official Rationale */}
          <div className="space-y-1.5">
            <label htmlFor="evidence-rationale-input" className="font-semibold text-slate-800">
              Official Statutory Rationale
            </label>
            <textarea
              id="evidence-rationale-input"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={2}
              placeholder="Explain how this circular, section, or precedent governs the indicator..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Similarity / Relevance Score (Optional) */}
          <div className="space-y-1.5">
            <label htmlFor="evidence-score-input" className="font-semibold text-slate-800">
              Relevance / Citation Score <span className="font-normal text-slate-400">(0.00 to 1.00, optional)</span>
            </label>
            <input
              id="evidence-score-input"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={similarityScore}
              onChange={(e) => setSimilarityScore(e.target.value)}
              placeholder="e.g. 0.88"
              className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-hidden font-mono"
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
              disabled={loading || (!researchDocumentId.trim() && !documentChunkId.trim())}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Linking Evidence...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Link as Official Statutory Evidence</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
