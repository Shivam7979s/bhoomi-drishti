import { Link } from 'react-router-dom';
import { ArrowRight, Bot, CheckCircle, HelpCircle, ShieldCheck, Sparkles } from 'lucide-react';

const SAMPLE_QUERIES = [
  'What statutory provisions govern land mutation timeliness under state revenue codes?',
  'How are disputed survey numbers reconciled during spatial cadastre digitization?',
  'Which published circulars specify procedural guidelines for tenancy record verification?',
];

export function AssistantShowcase() {
  return (
    <section aria-labelledby="assistant-heading" className="py-16 sm:py-20 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Mission & Capability */}
          <div className="space-y-6 text-left lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-md bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-900 border border-teal-200/80">
              <Bot className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
              <span>Evidence-Grounded Statutory AI</span>
            </div>

            <h2 id="assistant-heading" className="text-2xl font-black text-slate-900 sm:text-4xl tracking-tight">
              Ask the Statutory AI Assistant
            </h2>

            <p className="text-sm sm:text-base leading-relaxed text-slate-600">
              Query statutory acts, land tenancy regulations, and revenue court procedures. The assistant uses
              pre-retrieval authorization, source citation linking, and evidence sufficiency safeguards.
            </p>

            {/* AI Architecture Guardrails */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <CheckCircle className="h-4 w-4 text-teal-700 shrink-0" aria-hidden="true" />
                <span><strong>Verbatim Citations:</strong> Answers cite specific clauses, sections, and circulars.</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" aria-hidden="true" />
                <span><strong>Evidence Sufficiency Safeguards:</strong> Queries require relevant source evidence and decline to answer when supporting context is insufficient.</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Sparkles className="h-4 w-4 text-indigo-700 shrink-0" aria-hidden="true" />
                <span><strong>Pre-Retrieval Authorization:</strong> Project and role filters are validated before semantic indexing.</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2">
              <Link
                to="/assistant"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-xs font-bold text-white shadow-2xs hover:bg-teal-900 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-700"
              >
                <span>Launch Statutory Assistant</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Query Starters Preview */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-teal-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Example Statutory Inquiries
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Click to populate query in assistant</span>
              </div>

              {/* Sample Queries List */}
              <div className="space-y-3">
                {SAMPLE_QUERIES.map((q, idx) => (
                  <Link
                    key={idx}
                    to={`/assistant?q=${encodeURIComponent(q)}`}
                    className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all duration-150 hover:border-teal-300 hover:bg-teal-50/40 text-left"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-900 shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                        "{q}"
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-teal-700 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>

              {/* Legal Notice */}
              <div className="pt-2 text-[10px] text-slate-400 leading-normal border-t border-slate-100">
                Statutory research prototype · Synthesized responses are grounded in indexed statutory and policy documents and do not constitute formal legal counsel. Official determinations require confirmation from relevant revenue authorities.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
