import { AlertCircle, Bot, RotateCcw, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EvidenceDetailsModal } from '../../knowledge/components/EvidenceDetailsModal';
import type { EvidenceItem } from '../../knowledge/types/knowledge';
import { AssistantAnswerCard } from '../components/AssistantAnswerCard';
import { AssistantEmptyState } from '../components/AssistantEmptyState';
import { AssistantLoadingSkeleton } from '../components/AssistantLoadingSkeleton';
import { AssistantQueryForm } from '../components/AssistantQueryForm';
import { useAssistantQuery } from '../hooks/useAssistantQuery';
import {
  citationToEvidenceItem,
  type AssistantQueryRequestDTO,
  type CitationDTO,
} from '../types/assistant';

export function AssistantPage() {
  const [searchParams] = useSearchParams();
  const [prefilledQuery, setPrefilledQuery] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  const { data, isLoading, error, lastRequest, executeQuery, reset } = useAssistantQuery();

  // Read URL query parameter ?q= if supplied from Knowledge Search cross-link
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q.trim()) {
      setPrefilledQuery(q.trim());
    }
  }, [searchParams]);

  const handleSubmit = (request: AssistantQueryRequestDTO) => {
    executeQuery(request);
  };

  const handleSelectExample = (exampleQuery: string) => {
    setPrefilledQuery(exampleQuery);
    executeQuery({ query: exampleQuery });
  };

  const handleSelectCitation = (citation: CitationDTO) => {
    setSelectedEvidence(citationToEvidenceItem(citation));
  };

  const handleRetry = () => {
    if (lastRequest) {
      executeQuery(lastRequest);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
            <Bot className="h-4 w-4" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Evidence-Grounded Statutory AI Assistant
          </h1>
        </div>
        <p className="text-xs text-slate-600 sm:text-sm">
          Interactive assistance grounded strictly in verified statutory circulars, policy manuals,
          and cadastral research documents.
        </p>
      </div>

      {/* Advisory Banner */}
      <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 text-xs text-teal-900 flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-teal-950">Statutory Notice: </strong>
          BHOOMI-DRISHTI provides evidence-backed synthesis based exclusively on authorized documents in
          the knowledge repository. It does not replace certified legal counsel or official revenue
          authority rulings.
        </p>
      </div>

      {/* Main Query Form */}
      <AssistantQueryForm
        initialQuery={prefilledQuery}
        isLoading={isLoading}
        onSubmit={handleSubmit}
      />

      {/* Error Alert with Retry */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-xs text-red-800 flex items-start justify-between gap-4 shadow-2xs"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="text-xs font-bold text-red-900 uppercase tracking-wider">
                Assistant Query Error
              </h2>
              <p className="mt-1 text-xs text-red-700 leading-relaxed">{error}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1 rounded-lg bg-red-100 hover:bg-red-200 px-3 py-1.5 text-xs font-semibold text-red-900 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-red-200 bg-white hover:bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-800 transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && <AssistantLoadingSkeleton />}

      {/* Answer Display */}
      {!isLoading && data && (
        <AssistantAnswerCard
          response={data}
          onSelectCitation={handleSelectCitation}
        />
      )}

      {/* Initial Empty State */}
      {!isLoading && !data && !error && (
        <AssistantEmptyState onSelectQuery={handleSelectExample} />
      )}

      {/* Citation Provenance Inspection Modal (Reused from Knowledge feature) */}
      <EvidenceDetailsModal
        evidence={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
      />
    </div>
  );
}
