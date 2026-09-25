import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  FileQuestion,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import type {
  AssistantQueryResponseDTO,
  CitationDTO,
} from '../types/assistant';
import { CitationChip } from './CitationChip';
import { CitationSourceList } from './CitationSourceList';
import { GroundingStatusBadge } from './GroundingStatusBadge';

interface AssistantAnswerCardProps {
  response: AssistantQueryResponseDTO;
  onSelectCitation: (citation: CitationDTO) => void;
}

export function AssistantAnswerCard({
  response,
  onSelectCitation,
}: AssistantAnswerCardProps) {
  const [showMetadata, setShowMetadata] = useState(false);

  const { query, answer, groundingStatus, citations, disclaimer, retrievalMetadata } =
    response;

  // Build citation lookup map
  const citationMap = new Map<number, CitationDTO>();
  if (citations) {
    for (const c of citations) {
      citationMap.set(c.citationIndex, c);
    }
  }

  // Render paragraphs with interactive citations
  const renderFormattedAnswer = (text: string) => {
    if (!text) return null;

    const paragraphs = text.split(/\n\n+/);

    return (
      <div className="space-y-3.5 text-slate-800 text-sm leading-relaxed break-words">
        {paragraphs.map((para, pIdx) => {
          const lines = para.split(/\n/);
          return (
            <p key={pIdx} className="leading-relaxed">
              {lines.map((line, lIdx) => {
                const tokens = line.split(/(\[\d+\])/g);
                return (
                  <span key={lIdx}>
                    {lIdx > 0 && <br />}
                    {tokens.map((token, tIdx) => {
                      const match = token.match(/^\[(\d+)\]$/);
                      if (match) {
                        const idx = parseInt(match[1], 10);
                        const citation = citationMap.get(idx);
                        return (
                          <CitationChip
                            key={tIdx}
                            citationIndex={idx}
                            citation={citation}
                            onClick={onSelectCitation}
                          />
                        );
                      }
                      return <span key={tIdx}>{token}</span>;
                    })}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <GroundingStatusBadge status={groundingStatus} />
          {citations && citations.length > 0 && (
            <span className="text-xs text-slate-400 font-medium">
              • {citations.length} verified {citations.length === 1 ? 'citation' : 'citations'}
            </span>
          )}
        </div>
      </div>

      {/* Query Echo Banner */}
      <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-700">Question: </span>
        <span className="italic font-medium text-slate-900 break-words">"{query}"</span>
      </div>

      {/* Specific Status Alert Context */}
      {groundingStatus === 'WEAK_EVIDENCE' && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold text-amber-900">
              Caution: Marginal Evidence Support
            </p>
            <p className="mt-0.5 text-amber-800 leading-normal">
              The retrieved documents have weak semantic relevance to your question. Generative AI
              synthesis was withheld to prevent hallucination; verbatim excerpts from available
              documents are provided below.
            </p>
          </div>
        </div>
      )}

      {groundingStatus === 'FALLBACK' && (
        <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-800 flex items-start gap-3">
          <Layers className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold text-sky-900">
              Extractive Source Excerpts
            </p>
            <p className="mt-0.5 text-sky-800 leading-normal">
              The generative synthesis engine was unavailable. Deterministic excerpts extracted
              directly from official documents are presented below.
            </p>
          </div>
        </div>
      )}

      {groundingStatus === 'NO_EVIDENCE' && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
          <FileQuestion className="h-9 w-9 text-slate-400 mx-auto mb-2" aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-800">
            No Sufficient Evidence Found
          </h3>
          <p className="mt-1 text-xs text-slate-600 max-w-lg mx-auto">
            The knowledge repository does not currently contain documents or statutory circulars
            matching this query with sufficient relevance. Try querying specific land tenure laws,
            cadastral survey guidelines, or policy circulars.
          </p>
        </div>
      )}

      {/* Answer Body */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-5">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-800 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
          <span>Statutory Assistant Response</span>
        </div>
        {renderFormattedAnswer(answer)}
      </div>

      {/* Technical Diagnostics / Audit Disclosure (Secondary) */}
      {retrievalMetadata && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowMetadata(!showMetadata)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition"
          >
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Audit & Retrieval Diagnostics</span>
            {showMetadata ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {showMetadata && (
            <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="block text-slate-400 text-[11px]">Provider</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Cpu className="h-3 w-3 text-slate-400" aria-hidden="true" />
                  {String(retrievalMetadata.providerUsed ?? 'Standard RAG')}
                </span>
              </div>
              {retrievalMetadata.retrievalDurationMs != null && (
                <div>
                  <span className="block text-slate-400 text-[11px]">Retrieval Time</span>
                  <span className="font-semibold text-slate-800">
                    {String(retrievalMetadata.retrievalDurationMs)} ms
                  </span>
                </div>
              )}
              {retrievalMetadata.synthesisDurationMs != null && (
                <div>
                  <span className="block text-slate-400 text-[11px]">Synthesis Time</span>
                  <span className="font-semibold text-slate-800">
                    {String(retrievalMetadata.synthesisDurationMs)} ms
                  </span>
                </div>
              )}
              {retrievalMetadata.totalDurationMs != null && (
                <div>
                  <span className="block text-slate-400 text-[11px]">Total Latency</span>
                  <span className="font-semibold text-slate-800">
                    {String(retrievalMetadata.totalDurationMs)} ms
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Backend Statutory Disclaimer */}
      {disclaimer && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="leading-relaxed">{disclaimer}</p>
        </div>
      )}

      {/* Cited Sources List */}
      <CitationSourceList
        citations={citations}
        onSelectCitation={onSelectCitation}
      />
    </div>
  );
}
