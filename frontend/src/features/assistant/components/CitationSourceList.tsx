import { BookOpen } from 'lucide-react';
import type { CitationDTO } from '../types/assistant';
import { EvidenceSourceCard } from './EvidenceSourceCard';

interface CitationSourceListProps {
  citations: CitationDTO[];
  onSelectCitation: (citation: CitationDTO) => void;
}

export function CitationSourceList({
  citations,
  onSelectCitation,
}: CitationSourceListProps) {
  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Supporting Evidence & Source Provenance
            </h3>
            <p className="text-xs text-slate-500">
              Verified statutory circulars and research documents cited in this answer
            </p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
          {citations.length} {citations.length === 1 ? 'source' : 'sources'} cited
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {citations.map((citation) => (
          <EvidenceSourceCard
            key={`${citation.documentId}-${citation.citationIndex}`}
            citation={citation}
            onSelect={onSelectCitation}
          />
        ))}
      </div>
    </div>
  );
}
