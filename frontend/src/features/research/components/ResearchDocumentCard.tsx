import {
  Calendar,
  Edit2,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  MapPin,
  Tag,
  User,
} from 'lucide-react';
import type { DocumentType, ResearchDocument } from '../types/research';

interface ResearchDocumentCardProps {
  document: ResearchDocument;
  onView: (doc: ResearchDocument) => void;
  onEdit?: (doc: ResearchDocument) => void;
  canEdit?: boolean;
}

export function ResearchDocumentCard({
  document: doc,
  onView,
  onEdit,
  canEdit,
}: ResearchDocumentCardProps) {
  function getTypeBadge(type: DocumentType) {
    switch (type) {
      case 'RESEARCH_PAPER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'POLICY_DOCUMENT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'GOVERNMENT_REPORT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ACADEMIC_PUBLICATION':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'DATASET':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CASE_STUDY':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'LEGAL_DOCUMENT':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  function formatType(type: DocumentType) {
    return type.replace(/_/g, ' ');
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-md">
      <div>
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getTypeBadge(
              doc.documentType,
            )}`}
          >
            <FileText className="h-3 w-3" />
            {formatType(doc.documentType)}
          </span>

          <div className="flex items-center gap-1.5">
            {doc.status !== 'PUBLISHED' && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  doc.status === 'DRAFT'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {doc.status}
              </span>
            )}
            {doc.linkedLandRecordCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-100">
                <MapPin className="h-3 w-3" />
                {doc.linkedLandRecordCount} {doc.linkedLandRecordCount === 1 ? 'parcel' : 'parcels'}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-emerald-700 transition line-clamp-2">
          {doc.title}
        </h3>

        {/* Description */}
        <p className="mt-2 text-sm text-slate-600 line-clamp-3">
          {doc.description}
        </p>

        {/* Metadata info */}
        <div className="mt-4 space-y-1.5 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="font-medium text-slate-700 truncate">{doc.authors}</span>
            {doc.organization && (
              <span className="truncate text-slate-400">• {doc.organization}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {doc.publicationDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{doc.publicationDate}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <span className="uppercase">{doc.language}</span>
            </div>
          </div>

          {doc.keywords && (
            <div className="flex items-center gap-1 pt-1 truncate">
              <Tag className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="truncate text-[11px] text-slate-500">{doc.keywords}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          {doc.sourceUrl && (
            <a
              href={doc.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-0.5"
              title="Open Source URL"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Source
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canEdit && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(doc)}
              className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </button>
          )}

          <button
            type="button"
            onClick={() => onView(doc)}
            className="flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
          >
            <Eye className="h-3.5 w-3.5" />
            Details
          </button>
        </div>
      </div>
    </div>
  );
}
