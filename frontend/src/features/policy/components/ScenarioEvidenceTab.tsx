import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, ShieldCheck, FileText, AlertCircle, Sparkles } from 'lucide-react';
import { getScenarioEvidence, unlinkEvidence } from '../services/policyService';
import { EvidenceSearchModal } from './EvidenceSearchModal';
import type { PolicyScenario, ScenarioEvidence, EvidenceType } from '../types/policy';

interface ScenarioEvidenceTabProps {
  scenario: PolicyScenario;
  canEdit: boolean;
}

const EVIDENCE_TYPE_BADGES: Record<EvidenceType, { label: string; bg: string; text: string; border: string }> = {
  STATUTORY_AUTHORITY: {
    label: 'Statutory Authority',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  POLICY_GUIDELINE: {
    label: 'Policy Guideline',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  DISPUTE_PRECEDENT: {
    label: 'Dispute Precedent',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  ENVIRONMENTAL_BASELINE: {
    label: 'Environmental Baseline',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
  },
  METHODOLOGICAL_REFERENCE: {
    label: 'Methodological Reference',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
  },
};

export function ScenarioEvidenceTab({ scenario, canEdit }: ScenarioEvidenceTabProps) {
  const [evidenceList, setEvidenceList] = useState<ScenarioEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const isArchived = scenario.status === 'ARCHIVED';
  const allowsEdit = canEdit && !isArchived;

  async function loadEvidence() {
    setLoading(true);
    setError(null);
    try {
      const data = await getScenarioEvidence(scenario.id);
      setEvidenceList(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load scenario evidence');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvidence();
  }, [scenario.id]);

  async function handleUnlink(evidenceId: string) {
    if (!window.confirm('Unlink this evidence record from the policy scenario?')) return;

    setUnlinkingId(evidenceId);
    try {
      await unlinkEvidence(scenario.id, evidenceId);
      setEvidenceList((prev) => prev.filter((e) => e.id !== evidenceId));
    } catch (err: any) {
      alert(err?.message || 'Failed to unlink evidence');
    } finally {
      setUnlinkingId(null);
    }
  }

  function handleEvidenceLinked(newEvidence: ScenarioEvidence) {
    setEvidenceList((prev) => [newEvidence, ...prev]);
  }

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Statutory &amp; Research Evidence ({evidenceList.length})
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Explicitly linked circulars, case precedents, and academic research providing provenance for this scenario.
          </p>
        </div>

        {allowsEdit && (
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" />
            Search &amp; Link Evidence
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Evidence Cards List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : evidenceList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-800">No Evidence Linked</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Attach official circulars, land ceiling acts, or judicial precedents to establish transparent provenance.
          </p>
          {allowsEdit && (
            <button
              type="button"
              onClick={() => setShowSearchModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              Discover Evidence Candidates
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {evidenceList.map((item) => {
            const badge = EVIDENCE_TYPE_BADGES[item.evidenceType] || {
              label: item.evidenceType,
              bg: 'bg-slate-50',
              text: 'text-slate-800',
              border: 'border-slate-200',
            };

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {badge.label}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {item.documentType}
                        </span>
                        {item.similarityScore !== null && item.similarityScore !== undefined && (
                          <span className="rounded bg-teal-50 px-2 py-0.5 text-[11px] font-mono text-teal-800 border border-teal-200">
                            Similarity: {item.similarityScore.toFixed(4)}
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-slate-900 leading-snug">
                        {item.documentTitle}
                      </h4>
                    </div>

                    {allowsEdit && (
                      <button
                        type="button"
                        onClick={() => handleUnlink(item.id)}
                        disabled={unlinkingId === item.id}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition"
                        title="Unlink evidence"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Provenance Chunk Snippet */}
                  {item.chunkText && (
                    <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs leading-relaxed text-slate-700">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mb-1">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        <span>Exact Citation Excerpt</span>
                        {item.chunkPageNumber && <span>&bull; Page {item.chunkPageNumber}</span>}
                        {item.chunkSectionTitle && <span>&bull; {item.chunkSectionTitle}</span>}
                      </div>
                      <p className="italic">&ldquo;{item.chunkText}&rdquo;</p>
                    </div>
                  )}

                  {/* Rationale */}
                  {item.rationale && (
                    <div className="mt-2.5 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">Policy Rationale: </span>
                      {item.rationale}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                  <span>Linked by: {item.linkedByName || 'Project Member'}</span>
                  <span>{new Date(item.linkedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Evidence Search Modal */}
      <EvidenceSearchModal
        scenarioId={scenario.id}
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onEvidenceLinked={handleEvidenceLinked}
      />
    </div>
  );
}
