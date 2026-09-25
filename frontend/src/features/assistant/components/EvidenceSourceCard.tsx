import {
  BookOpen,
  Calendar,
  ExternalLink,
  FileText,
  User,
} from 'lucide-react';
import type { CitationDTO } from '../types/assistant';

interface EvidenceSourceCardProps {
  citation: CitationDTO;
  onSelect: (citation: CitationDTO) => void;
}

export function EvidenceSourceCard({
  citation,
  onSelect,
}: EvidenceSourceCardProps) {
  function getTypeBadgeClass(type: string) {
    switch (type) {
      case 'RESEARCH_PAPER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'POLICY_DOCUMENT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'GOVERNMENT_REPORT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ACADEMIC_PUBLICATION':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'LEGAL_DOCUMENT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-teal-300 hover:shadow-md">
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center justify-center rounded-md bg-teal-600 px-2 py-0.5 text-xs font-bold text-white shadow-2xs">
              [{citation.citationIndex}]
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${getTypeBadgeClass(
                citation.documentType,
              )}`}
            >
              {citation.documentType.replace(/_/g, ' ')}
            </span>
            {citation.pageNumber != null && (
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                Page {citation.pageNumber}
              </span>
            )}
            {citation.sectionTitle && (
              <span className="inline-flex max-w-[200px] truncate items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                § {citation.sectionTitle}
              </span>
            )}
          </div>
        </div>

        {/* Document Title */}
        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-teal-700 transition line-clamp-2 mb-1.5 break-words">
          {citation.documentTitle}
        </h4>

        {/* Authors & Organization */}
        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mb-2.5">
          {citation.authors && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-[180px]">{citation.authors}</span>
            </span>
          )}
          {citation.organization && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-[180px]">{citation.organization}</span>
            </span>
          )}
          {citation.publicationDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{citation.publicationDate}</span>
            </span>
          )}
        </div>

        {/* Quoted Excerpt Box */}
        {citation.quote && (
          <div className="relative rounded-lg border border-slate-100 bg-slate-50/80 p-3 mb-3">
            <p className="text-xs leading-relaxed text-slate-700 italic font-serif line-clamp-3">
              "{citation.quote}"
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-auto">
        <div className="flex items-center gap-2">
          {citation.sourceUrl && (
            <a
              href={citation.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-teal-600 transition"
              title="Open Original Source URL"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Source URL</span>
            </a>
          )}
        </div>

        <button
          type="button"
          onClick={() => onSelect(citation)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 transition cursor-pointer"
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Inspect Provenance</span>
        </button>
      </div>
    </div>
  );
}
