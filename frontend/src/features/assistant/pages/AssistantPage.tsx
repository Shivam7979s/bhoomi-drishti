import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Link2,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
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
  const { t } = useLanguage();
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
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ── 1. Sovereign Breadcrumb & Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/90 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5">
            <Link to="/dashboard" className="flex items-center gap-1 hover:text-emerald-700 transition">
              <span>{t.assistantPage.breadcrumbHome}</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-emerald-900 font-bold">{t.assistantPage.breadcrumbCurrent}</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {t.assistantPage.pageTitle}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>{t.assistantPage.badgeAiSynthesis}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              <span>PostGIS & DLRMP Grounded</span>
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-3xl font-medium">
            {t.assistantPage.pageSubtitle}
          </p>
        </div>
      </div>

      {/* ── 2. Sovereign AI Metric Chips ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Statutes Indexed */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
            <Scale className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {t.assistantPage.metricStatutesIndexedTitle}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
              {t.assistantPage.metricStatutesIndexedSub}
            </p>
          </div>
        </div>

        {/* Metric 2: Gating Threshold */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {t.assistantPage.metricGroundingThresholdTitle}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
              {t.assistantPage.metricGroundingThresholdSub}
            </p>
          </div>
        </div>

        {/* Metric 3: Response Velocity */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-2xs">
            <Zap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {t.assistantPage.metricAvgLatencyTitle}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
              {t.assistantPage.metricAvgLatencySub}
            </p>
          </div>
        </div>

        {/* Metric 4: Statutory Provenance */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0 border border-teal-200/60 shadow-2xs">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {t.assistantPage.metricZeroHallucinationTitle}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
              {t.assistantPage.metricZeroHallucinationSub}
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. Sovereign Advisory Notice ── */}
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white p-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
              {t.assistantPage.advisoryNotice}
            </h2>
            <p className="text-xs text-slate-700 mt-0.5 leading-relaxed font-medium">
              {t.assistantPage.advisoryDisclaimer}
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. Active Statutory Context Banner (when applicable) ── */}
      {activeContext && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-900 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shrink-0">
              <Link2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-950 uppercase tracking-wider text-[11px]">
                  {t.assistantPage.activeContextLabel}
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
                {t.assistantPage.activeContextDesc}
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
            <span>{t.assistantPage.btnClearContext}</span>
          </button>
        </div>
      )}

      {/* ── 5. Main Query Form ── */}
      <AssistantQueryForm
        initialQuery={prefilledQuery}
        isLoading={isLoading}
        onSubmit={handleSubmit}
      />

      {/* ── 6. Error Alert with Retry ── */}
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
              className="inline-flex items-center gap-1 rounded-lg bg-red-100 hover:bg-red-200 px-3 py-1.5 text-xs font-semibold text-red-900 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-red-200 bg-white hover:bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-800 transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── 7. Loading State ── */}
      {isLoading && <AssistantLoadingSkeleton />}

      {/* ── 8. Answer Display ── */}
      {!isLoading && data && (
        <AssistantAnswerCard
          response={data}
          onSelectCitation={handleSelectCitation}
        />
      )}

      {/* ── 9. Initial Empty State with Suggested Queries ── */}
      {!isLoading && !data && !error && (
        <AssistantEmptyState onSelectQuery={handleSelectExample} />
      )}

      {/* ── 10. Citation Provenance Inspection Modal ── */}
      <EvidenceDetailsModal
        evidence={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
      />
    </div>
  );
}
