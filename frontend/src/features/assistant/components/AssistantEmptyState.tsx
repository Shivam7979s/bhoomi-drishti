import { BookOpen, Compass, ShieldCheck, Sparkles } from 'lucide-react';

interface AssistantEmptyStateProps {
  onSelectQuery: (query: string) => void;
}

const EXAMPLE_QUERIES = [
  {
    category: 'Land Transfer Regulations',
    query: 'What statutory provisions address agricultural land transfers?',
  },
  {
    category: 'Cadastral Standards',
    query: 'What are the cadastral boundary accuracy standards for drone surveys?',
  },
  {
    category: 'Record of Rights',
    query: 'What documents outline the digitization requirements for Record of Rights?',
  },
  {
    category: 'Forest & Tribal Rights',
    query: 'What legal frameworks address tribal land tenure and forest rights?',
  },
];

export function AssistantEmptyState({ onSelectQuery }: AssistantEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-4 border border-teal-100 shadow-2xs">
          <Sparkles className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
          Evidence-Grounded Statutory & Policy Intelligence
        </h2>
        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          Ask specific statutory or land governance questions. Every synthesized response is backed
          by authoritative excerpts retrieved from published research documents, policy circulars, and
          cadastral survey manuals.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>Strict Evidence Grounding</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            The assistant only generates answers supported by verified chunks. Weak or missing evidence
            triggers automatic extractive safety gating.
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1.5">
            <BookOpen className="h-4 w-4 text-teal-600 shrink-0" aria-hidden="true" />
            <span>Interactive Provenance</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            Every bracketed citation references an exact chunk in the database with page numbers,
            section titles, and publication metadata.
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1.5">
            <Compass className="h-4 w-4 text-indigo-600 shrink-0" aria-hidden="true" />
            <span>No Phantom Hallucinations</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            Unreferenced or fabricated citations are stripped by server-side verification before the
            answer is delivered to your screen.
          </p>
        </div>
      </div>

      {/* Suggested Example Questions */}
      <div className="mt-8 border-t border-slate-100 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center sm:text-left">
          Suggested Statutory Inquiries
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {EXAMPLE_QUERIES.map((eq) => (
            <button
              key={eq.query}
              type="button"
              onClick={() => onSelectQuery(eq.query)}
              className="flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50/40 p-3 text-left transition hover:border-teal-300 hover:bg-teal-50/30 group cursor-pointer"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                {eq.category}
              </span>
              <span className="text-xs font-medium text-slate-800 group-hover:text-teal-900 mt-0.5">
                "{eq.query}"
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
