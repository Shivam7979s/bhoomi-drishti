import { Loader2, Search, ShieldCheck, Sparkles } from 'lucide-react';

export function AssistantLoadingSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6"
    >
      {/* Header Loading Status */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Retrieving Evidence & Synthesizing Statutory Response
            </h3>
            <p className="text-xs text-slate-500">
              Performing semantic vector search and verifying citation grounding (up to 30s)
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 border border-teal-200">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Evidence Gating Active
        </span>
      </div>

      {/* Progress Steps Indicator */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-100 p-2.5">
          <Search className="h-4 w-4 text-teal-600 shrink-0" aria-hidden="true" />
          <span className="text-slate-700 font-medium">1. Semantic Retrieval</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-100 p-2.5">
          <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" aria-hidden="true" />
          <span className="text-slate-700 font-medium">2. Evidence Quality Gate</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-100 p-2.5">
          <Sparkles className="h-4 w-4 text-teal-600 shrink-0" aria-hidden="true" />
          <span className="text-slate-700 font-medium">3. Citation Reconcile</span>
        </div>
      </div>

      {/* Skeleton Blocks (Honest placeholder, no fake token typing) */}
      <div className="space-y-3 pt-2">
        <div className="h-4 w-3/4 rounded-md bg-slate-200/80 animate-pulse" />
        <div className="h-4 w-full rounded-md bg-slate-200/80 animate-pulse" />
        <div className="h-4 w-5/6 rounded-md bg-slate-200/80 animate-pulse" />
        <div className="h-4 w-2/3 rounded-md bg-slate-200/80 animate-pulse" />
      </div>

      {/* Secondary Source Skeletons */}
      <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="h-20 rounded-xl border border-slate-100 bg-slate-50 animate-pulse" />
        <div className="h-20 rounded-xl border border-slate-100 bg-slate-50 animate-pulse" />
      </div>

      <span className="sr-only">Query in progress, please wait...</span>
    </div>
  );
}
