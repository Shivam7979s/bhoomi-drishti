import { AlertCircle, Bot, Link2, RotateCcw, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppContainer } from '../../../components/layout/AppContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { AdvisoryBanner } from '../../../components/layout/AdvisoryBanner';
import { EvidenceDetailsModal } from '../../knowledge/components/EvidenceDetailsModal';
import type { EvidenceItem } from '../../knowledge/types/knowledge';
import { AssistantAnswerCard } from '../components/AssistantAnswerCard';
import { AssistantEmptyState } from '../components/AssistantEmptyState';
import { AssistantLoadingSkeleton } from '../components/AssistantLoadingSkeleton';
import { AssistantQueryForm } from '../components/AssistantQueryForm';
import { useAssistantQuery } from '../hooks/useAssistantQuery';
import {
  citationToEvidenceItem,
  type AssistantContextRequestDTO,
  type AssistantQueryRequestDTO,
  type CitationDTO,
} from '../types/assistant';

export function AssistantPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [prefilledQuery, setPrefilledQuery] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [activeContext, setActiveContext] = useState<AssistantContextRequestDTO | null>(null);

  const { data, isLoading, error, lastRequest, executeQuery, reset } = useAssistantQuery();

  // Read URL query parameters and contextual linking if supplied
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q.trim()) {
      setPrefilledQuery(q.trim());
    }

    const indicatorCode = searchParams.get('indicatorCode') || undefined;
    const snapshotId = searchParams.get('snapshotId') || undefined;
    const comparisonBaseSnapshotId =
      searchParams.get('comparisonBaseSnapshotId') || searchParams.get('baseSnapshotId') || undefined;
    const comparisonTargetSnapshotId =
      searchParams.get('comparisonTargetSnapshotId') || searchParams.get('targetSnapshotId') || undefined;
    const documentId = searchParams.get('documentId') || undefined;
    const landRecordId = searchParams.get('landRecordId') || undefined;
    const projectId = searchParams.get('projectId') || undefined;
    const contextType = searchParams.get('contextType') || undefined;
    const contextTitle = searchParams.get('contextTitle') || undefined;

    if (
      indicatorCode ||
      snapshotId ||
      (comparisonBaseSnapshotId && comparisonTargetSnapshotId) ||
      documentId ||
      landRecordId
    ) {
      setActiveContext({
        indicatorCode,
        snapshotId,
        comparisonBaseSnapshotId,
        comparisonTargetSnapshotId,
        documentId,
        landRecordId,
        projectId,
        contextType,
        contextTitle,
      });

      if (!q) {
        if (comparisonBaseSnapshotId && comparisonTargetSnapshotId) {
          setPrefilledQuery(
            'Explain the statutory and methodological reasons for the variance between these two snapshot audits.'
          );
        } else if (indicatorCode) {
          setPrefilledQuery(
            `Explain the statutory basis and calculation methodology for indicator ${indicatorCode}.`
          );
        } else if (snapshotId) {
          setPrefilledQuery(
            'Summarize the statutory compliance and evidence findings in this snapshot audit.'
          );
        } else if (documentId) {
          setPrefilledQuery(
            'What are the key statutory mandates and provisions established in this document?'
          );
        } else if (landRecordId) {
          setPrefilledQuery(
            'What statutory restrictions and land use regulations apply to this parcel?'
          );
        }
      }
    }
  }, [searchParams]);

  const handleClearContext = () => {
    setActiveContext(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('contextType');
    newParams.delete('indicatorCode');
    newParams.delete('snapshotId');
    newParams.delete('comparisonBaseSnapshotId');
    newParams.delete('baseSnapshotId');
    newParams.delete('comparisonTargetSnapshotId');
    newParams.delete('targetSnapshotId');
    newParams.delete('documentId');
    newParams.delete('landRecordId');
    newParams.delete('projectId');
    newParams.delete('contextTitle');
    setSearchParams(newParams);
  };

  const handleSubmit = (request: AssistantQueryRequestDTO) => {
    executeQuery({
      ...request,
      context: activeContext ?? undefined,
    });
  };

  const handleSelectExample = (exampleQuery: string) => {
    setPrefilledQuery(exampleQuery);
    executeQuery({
      query: exampleQuery,
      context: activeContext ?? undefined,
    });
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
    <AppContainer>
      {/* Sovereign Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Explore', to: '/explore' },
          { label: 'AI Assistant' },
        ]}
        badge={{
          text: 'Statutory AI Synthesis',
          icon: Bot,
          variant: 'teal',
        }}
        title="Evidence-Grounded Statutory AI Assistant"
        description="Interactive legal synthesis grounded strictly in verified statutory circulars, policy manuals, and cadastral research documents with pre-retrieval role checks and evidence sufficiency safeguards."
      />

      {/* Standardized Advisory Banner */}
      <AdvisoryBanner
        variant="statutory"
        title="Statutory Research Notice"
      >
        <p className="font-medium text-teal-950">
          BHOOMI-DRISHTI provides evidence-backed synthesis based exclusively on authorized documents in
          the knowledge repository. It does not replace certified legal counsel or official revenue
          authority rulings.
        </p>
      </AdvisoryBanner>

      {/* Active Statutory Context Banner */}
      {activeContext && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-900 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shrink-0">
              <Link2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-950 uppercase tracking-wider text-[11px]">
                  Active Statutory Context:
                </span>
                <span className="rounded bg-blue-200/70 px-1.5 py-0.5 font-medium text-blue-900 truncate">
                  {activeContext.contextTitle ||
                    activeContext.indicatorCode ||
                    (activeContext.documentId ? 'Research Document' : '') ||
                    (activeContext.landRecordId ? 'Land Record' : '') ||
                    (activeContext.snapshotId ? 'Governance Snapshot' : '') ||
                    'Platform Resource'}
                </span>
              </div>
              <p className="mt-0.5 text-blue-700 text-[11px] truncate">
                Retrieval and statutory synthesis will be grounded in and restricted to this platform resource.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearContext}
            aria-label="Clear active statutory context"
            className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-white hover:bg-blue-100/70 px-2 py-1 text-xs font-medium text-blue-800 transition shrink-0 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Clear context to query entire statutory repository"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Clear Context</span>
          </button>
        </div>
      )}

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
    </AppContainer>
  );
}
