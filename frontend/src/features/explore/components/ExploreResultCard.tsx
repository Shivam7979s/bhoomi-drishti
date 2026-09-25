import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Link2, User } from 'lucide-react';
import type { ResearchDocument } from '../../research/types/research';

interface ExploreResultCardProps {
  document: ResearchDocument;
}

const TYPE_COLORS: Record<string, string> = {
  POLICY_DOCUMENT: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  LEGAL_DOCUMENT: 'bg-purple-50 text-purple-900 border-purple-200',
  GOVERNMENT_REPORT: 'bg-blue-50 text-blue-900 border-blue-200',
  RESEARCH_PAPER: 'bg-amber-50 text-amber-900 border-amber-200',
  ACADEMIC_PUBLICATION: 'bg-indigo-50 text-indigo-900 border-indigo-200',
  CASE_STUDY: 'bg-teal-50 text-teal-900 border-teal-200',
  DATASET: 'bg-slate-100 text-slate-800 border-slate-200',
  OTHER: 'bg-slate-50 text-slate-700 border-slate-200',
};

export function ExploreResultCard({ document: doc }: ExploreResultCardProps) {
  const typeBadgeClass = TYPE_COLORS[doc.documentType] || TYPE_COLORS.OTHER;
  const authorDisplay = doc.authors || doc.organization || 'Institutional Source';

  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-emerald-300 hover:shadow-md transition-all duration-200">
      <div className="space-y-3">
        {/* Top Meta: Document Type Badge + Date */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeBadgeClass}`}>
            {doc.documentType.replace(/_/g, ' ')}
          </span>

          {doc.publicationDate && (
            <div className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              <time dateTime={doc.publicationDate}>{doc.publicationDate}</time>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-950 transition-colors leading-snug">
          <Link to={`/research?docId=${doc.id}`} className="focus:outline-hidden hover:underline">
            {doc.title}
          </Link>
        </h3>

        {/* Snippet / Abstract */}
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
          {doc.description || doc.abstractText || 'Published statutory or policy document indexed in platform repository.'}
        </p>

        {/* Author / Contributor */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <span className="truncate">{authorDisplay}</span>
        </div>
      </div>

      {/* Footer: Linked Records & Action */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link2 className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
          <span>{doc.linkedLandRecordCount} Linked Records</span>
        </div>

        <Link
          to={`/research?docId=${doc.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
        >
          <span>View Document</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
