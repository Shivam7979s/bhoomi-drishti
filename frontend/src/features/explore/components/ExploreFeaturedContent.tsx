import { Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import type { ResearchDocument } from '../../research/types/research';
import { ExploreResultCard } from './ExploreResultCard';

interface ExploreFeaturedContentProps {
  documents: ResearchDocument[];
  isLoading: boolean;
  error: string | null;
}

export function ExploreFeaturedContent({
  documents,
  isLoading,
  error,
}: ExploreFeaturedContentProps) {
  return (
    <section id="explore-featured" aria-labelledby="featured-heading" className="scroll-mt-20 space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="text-left space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
            Published Corpus
          </span>
          <h2 id="featured-heading" className="text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
            Featured Published Documents
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Curated statutory revenue codes, circulars, and land governance research documents indexed in BHOOMI-DRISHTI.
          </p>
        </div>

        <Link
          to="/research"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 shrink-0 self-start sm:self-auto py-1"
        >
          <span>View All in Research Hub</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-4">
              <div className="h-4 w-28 bg-slate-200 rounded" />
              <div className="h-6 w-4/5 bg-slate-200 rounded" />
              <div className="h-16 w-full bg-slate-200 rounded" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <ExploreResultCard key={doc.id} document={doc} />
          ))}
        </div>
      ) : (
        /* Honest Empty State */
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center max-w-lg mx-auto space-y-3">
          <FileText className="h-8 w-8 text-slate-400 mx-auto" aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-800">No Published Research Documents Yet</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Published research papers, revenue circulars, and gazettes will appear here once indexed.
          </p>
          <div className="pt-2">
            <Link
              to="/research"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:underline"
            >
              <span>Explore Research Hub</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
          <span>Note: Research document indexing requires active backend connectivity. Browse the Research Hub for cached materials.</span>
        </div>
      )}
    </section>
  );
}
