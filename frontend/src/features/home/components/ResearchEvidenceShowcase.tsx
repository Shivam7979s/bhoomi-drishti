import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Calendar, FileText, Link2, Sparkles, User } from 'lucide-react';
import type { ResearchDocument } from '../../research/types/research';

interface ResearchEvidenceShowcaseProps {
  documents: ResearchDocument[];
  isLoading: boolean;
  error: string | null;
}

export function ResearchEvidenceShowcase({
  documents,
  isLoading,
  error,
}: ResearchEvidenceShowcaseProps) {
  return (
    <section aria-labelledby="research-heading" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-slate-100">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 border border-amber-200/80">
              <BookOpen className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
              <span>Statutory Corpus & Policy Papers</span>
            </div>
            <h2 id="research-heading" className="text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
              Evidence-Linked Statutory Research
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Discover published state revenue codes, tenancy guidelines, gazette notifications, and academic land
              tenure research linked directly to cadastral parcels.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/research"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-800 px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-amber-900 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-700"
            >
              <span>Explore Research Hub</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/knowledge"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <Sparkles className="h-4 w-4 text-teal-600" aria-hidden="true" />
              <span>Semantic Search</span>
            </Link>
          </div>
        </div>

        {/* Documents Cards Grid */}
        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-4">
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                  <div className="h-6 w-5/6 bg-slate-200 rounded" />
                  <div className="h-16 w-full bg-slate-200 rounded" />
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : documents.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/40 p-6 shadow-2xs hover:border-slate-300 hover:bg-white transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 uppercase">
                        {doc.documentType.replace(/_/g, ' ')}
                      </span>
                      {doc.publicationDate && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                          <Calendar className="h-3 w-3" />
                          <span>{doc.publicationDate}</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                      {doc.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {doc.description || doc.abstractText || 'Published statutory or policy document preserved in repository legal corpus.'}
                    </p>

                    <div className="flex items-center gap-1 text-xs text-slate-500 pt-1">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{doc.authors || doc.organization || 'Institutional Source'}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Link2 className="h-3.5 w-3.5 text-emerald-700" />
                      <span>{doc.linkedLandRecordCount} Linked Records</span>
                    </div>

                    <Link
                      to={`/research?docId=${doc.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950 transition"
                    >
                      <span>Read Document</span>
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Honest Empty State
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center max-w-xl mx-auto space-y-2">
              <FileText className="h-8 w-8 text-slate-400 mx-auto" aria-hidden="true" />
              <h3 className="text-sm font-bold text-slate-800">No Published Research Documents Yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Published research documents, state revenue acts, and policy papers will appear here once indexed.
              </p>
              <div className="pt-2">
                <Link
                  to="/research"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:underline"
                >
                  <span>Explore Research Hub</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800">
            <span>Note: Published research indexing requires live repository connectivity. Explore the Research Hub directly for cached legal circulars.</span>
          </div>
        )}
      </div>
    </section>
  );
}
