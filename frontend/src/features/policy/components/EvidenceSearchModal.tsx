import { useState } from 'react';
import { Search, X, Loader2, Link2, BookOpen, AlertCircle, Check } from 'lucide-react';
import { searchEvidenceCandidates, linkEvidence } from '../services/policyService';
import type { EvidenceType, ScenarioEvidence } from '../types/policy';
import type { EvidenceItem, KnowledgeSearchResponse } from '../../knowledge/types/knowledge';

interface EvidenceSearchModalProps {
  scenarioId: string;
  isOpen: boolean;
  onClose: () => void;
  onEvidenceLinked: (evidence: ScenarioEvidence) => void;
}

const EVIDENCE_TYPES: { value: EvidenceType; label: string }[] = [
  { value: 'STATUTORY_AUTHORITY', label: 'Statutory Authority' },
  { value: 'POLICY_GUIDELINE', label: 'Policy Guideline' },
  { value: 'DISPUTE_PRECEDENT', label: 'Dispute Precedent' },
  { value: 'ENVIRONMENTAL_BASELINE', label: 'Environmental Baseline' },
  { value: 'METHODOLOGICAL_REFERENCE', label: 'Methodological Reference' },
];

export function EvidenceSearchModal({
  scenarioId,
  isOpen,
  onClose,
  onEvidenceLinked,
}: EvidenceSearchModalProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResponse, setSearchResponse] = useState<KnowledgeSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Link form state
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);
  const [selectedEvidenceType, setSelectedEvidenceType] = useState<EvidenceType>('POLICY_GUIDELINE');
  const [rationale, setRationale] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setError(null);
    setSelectedItem(null);
    setLinkSuccess(false);

    try {
      const res = await searchEvidenceCandidates(scenarioId, {
        query: query.trim(),
        topK: 10,
      });
      setSearchResponse(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to search candidate evidence');
    } finally {
      setSearching(false);
    }
  }

  async function handleLink() {
    if (!selectedItem) return;

    setLinking(true);
    setError(null);

    try {
      const linked = await linkEvidence(scenarioId, {
        researchDocumentId: selectedItem.documentId,
        documentChunkId: selectedItem.chunkId,
        evidenceType: selectedEvidenceType,
        rationale: rationale.trim() || undefined,
        similarityScore: selectedItem.similarity,
      });

      setLinkSuccess(true);
      onEvidenceLinked(linked);
      setTimeout(() => {
        setSelectedItem(null);
        setRationale('');
        setLinkSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to link evidence to scenario');
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] max-h-[800px] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Search className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Search Knowledge Evidence</h3>
              <p className="text-xs text-slate-500">
                Discover statutory documents, circulars, and research chunks to link as policy rationale
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="border-b border-slate-100 bg-slate-50/70 p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search policy circulars, ceiling acts, re-zoning precedents, or court orders..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {searching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content: Candidates List + Link Form */}
        <div className="grid flex-1 grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-hidden">
          {/* Candidates Column */}
          <div className="flex flex-col overflow-y-auto p-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {searchResponse ? `Candidate Results (${searchResponse.results.length})` : 'Search Candidates'}
            </div>

            {!searchResponse && !searching && (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400">
                <BookOpen className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-xs">Type a query above to retrieve vector-grounded evidence chunks from the research knowledge base.</p>
              </div>
            )}

            {searchResponse && searchResponse.results.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400">
                <p className="text-xs">No matching candidate evidence found for &quot;{query}&quot;.</p>
              </div>
            )}

            {searchResponse?.results.map((item) => {
              const isSelected = selectedItem?.chunkId === item.chunkId;
              const simPct = Math.round(item.similarity * 100);

              return (
                <div
                  key={item.chunkId}
                  onClick={() => setSelectedItem(item)}
                  className={`cursor-pointer rounded-xl border p-3.5 transition text-left text-xs ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-bold text-slate-900 leading-snug line-clamp-1">
                      {item.documentTitle}
                    </h5>
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                      {simPct}% match
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-medium text-slate-700">{item.documentType}</span>
                    {item.pageNumber && <span>&bull; Page {item.pageNumber}</span>}
                    {item.sectionTitle && <span>&bull; {item.sectionTitle}</span>}
                  </div>

                  <p className="mt-2 line-clamp-3 text-slate-600 italic">
                    &ldquo;{item.text}&rdquo;
                  </p>
                </div>
              );
            })}
          </div>

          {/* Details & Link Action Column */}
          <div className="flex flex-col overflow-y-auto p-4 bg-slate-50/30">
            {selectedItem ? (
              <div className="flex flex-1 flex-col justify-between space-y-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Link Selected Candidate
                  </span>

                  <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-xs space-y-2">
                    <div className="font-bold text-slate-900 text-sm">{selectedItem.documentTitle}</div>
                    <div className="text-slate-500 text-[11px]">
                      Type: <span className="text-slate-800 font-medium">{selectedItem.documentType}</span> | Similarity Score: <span className="text-emerald-700 font-semibold">{selectedItem.similarity.toFixed(4)}</span>
                    </div>
                    {selectedItem.citation && (
                      <div className="text-slate-500 text-[11px] italic">
                        Citation: {selectedItem.citation}
                      </div>
                    )}
                    <div className="rounded-lg bg-slate-50 p-2.5 text-slate-700 text-xs leading-relaxed max-h-36 overflow-y-auto border border-slate-100">
                      {selectedItem.text}
                    </div>
                  </div>

                  {/* Form Controls */}
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Evidence Categorization <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedEvidenceType}
                        onChange={(e) => setSelectedEvidenceType(e.target.value as EvidenceType)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
                      >
                        {EVIDENCE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Policy Rationale / Context Notes
                      </label>
                      <textarea
                        rows={3}
                        value={rationale}
                        onChange={(e) => setRationale(e.target.value)}
                        placeholder="Explain why this statutory authority, circular, or precedent applies to this scenario intervention..."
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleLink}
                    disabled={linking || linkSuccess}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white shadow-sm transition ${
                      linkSuccess
                        ? 'bg-teal-600'
                        : 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50'
                    }`}
                  >
                    {linking ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Linking Evidence...
                      </>
                    ) : linkSuccess ? (
                      <>
                        <Check className="h-4 w-4" />
                        Evidence Linked!
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" />
                        Link Evidence to Scenario
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400">
                <Link2 className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs">Select a candidate result from the left to configure provenance categorization and link it.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
