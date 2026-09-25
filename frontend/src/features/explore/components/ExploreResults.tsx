import { AlertCircle, ChevronLeft, ChevronRight, FileQuestion, RefreshCw } from 'lucide-react';
import type { PageResponse, ResearchDocument } from '../../research/types/research';
import { ExploreResultCard } from './ExploreResultCard';

interface ExploreResultsProps {
  results: PageResponse<ResearchDocument> | null;
  isSearching: boolean;
  error: string | null;
  hasSearched: boolean;
  onPageChange: (newPage: number) => void;
  onRetry: () => void;
}

export function ExploreResults({
  results,
  isSearching,
  error,
  hasSearched,
  onPageChange,
  onRetry,
}: ExploreResultsProps) {
  // If user hasn't searched yet and there are no results, do not display results section
  if (!hasSearched && !isSearching && !results && !error) {
    return null;
  }

  return (
    <section aria-label="Search Results" className="mt-8 space-y-6">
      {/* Screen Reader Live Status Announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        {isSearching
          ? 'Searching published research documents...'
          : error
            ? 'Search encountered an error.'
            : results
              ? `Found ${results.totalElements} published documents. Page ${results.page + 1} of ${results.totalPages || 1}.`
              : ''}
      </div>

      {/* Loading Skeletons */}
      {isSearching && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-4">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-slate-200 rounded-full" />
                <div className="h-4 w-20 bg-slate-200 rounded" />
              </div>
              <div className="h-6 w-4/5 bg-slate-200 rounded" />
              <div className="h-14 w-full bg-slate-200 rounded" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isSearching && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-center max-w-lg mx-auto space-y-3">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" aria-hidden="true" />
          <h3 className="text-sm font-bold text-rose-900">Search Temporarily Unavailable</h3>
          <p className="text-xs text-rose-700 leading-relaxed">
            The search service is temporarily unreachable. Please check backend connectivity or try again shortly.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-800 shadow-2xs hover:bg-rose-50 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Results List */}
      {!isSearching && !error && results && results.content.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 border-b border-slate-100 pb-2">
            <span>
              Showing {results.page * results.size + 1}–{Math.min((results.page + 1) * results.size, results.totalElements)} of{' '}
              <strong className="text-slate-800 font-bold">{results.totalElements}</strong> published documents
            </span>
            <span>
              Page <strong className="text-slate-800 font-bold">{results.page + 1}</strong> of{' '}
              <strong>{results.totalPages}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.content.map((doc) => (
              <ExploreResultCard key={doc.id} document={doc} />
            ))}
          </div>

          {/* Accessible Pagination */}
          {results.totalPages > 1 && (
            <nav aria-label="Search Results Pagination" className="flex items-center justify-center gap-2 pt-6">
              <button
                type="button"
                onClick={() => onPageChange(results.page - 1)}
                disabled={results.first}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-semibold text-slate-600 px-3">
                Page {results.page + 1} of {results.totalPages}
              </span>

              <button
                type="button"
                onClick={() => onPageChange(results.page + 1)}
                disabled={results.last}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </nav>
          )}
        </div>
      )}

      {/* Honest Empty State */}
      {!isSearching && !error && results && results.content.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center max-w-lg mx-auto space-y-3">
          <FileQuestion className="h-8 w-8 text-slate-400 mx-auto" aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-800">No Matching Public Documents Found</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            We could not find any published statutory or research documents matching your criteria.
          </p>
          <div className="text-xs text-slate-500 pt-1 text-left bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="font-semibold text-slate-700 block mb-1">Search recommendations:</span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600">
              <li>Try broader terms (e.g. "mutation", "survey", "tenancy", "cadastre").</li>
              <li>Switch the document type filter back to "All Document Types".</li>
              <li>Explore direct domain sections or geographic maps below.</li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
