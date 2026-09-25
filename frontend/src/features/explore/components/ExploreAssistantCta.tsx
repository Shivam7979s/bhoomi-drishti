import { Link } from 'react-router-dom';
import { ArrowRight, Bot, HelpCircle, ShieldCheck, Sparkles } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'What statutory provisions govern land mutation timeliness under state revenue codes?',
  'How are disputed survey numbers reconciled during spatial cadastre digitization?',
  'Which published circulars specify procedural guidelines for tenancy record verification?',
];

export function ExploreAssistantCta() {
  return (
    <section id="explore-assistant" aria-labelledby="assistant-cta-heading" className="scroll-mt-20">
      <div className="rounded-3xl border border-teal-200/90 bg-gradient-to-br from-teal-50/60 via-white to-emerald-50/40 p-6 sm:p-10 shadow-sm space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Mission & Link */}
          <div className="lg:col-span-6 space-y-4 text-left">
            <div className="inline-flex items-center gap-2 rounded-md bg-teal-100/80 px-2.5 py-1 text-xs font-bold text-teal-900 border border-teal-300/60">
              <Bot className="h-3.5 w-3.5 text-teal-800" aria-hidden="true" />
              <span>Evidence-Grounded Assistance</span>
            </div>

            <h2 id="assistant-cta-heading" className="text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
              Need Help Finding Statutory Information?
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Ask our statutory AI assistant to find verbatim citations, explain land tenure provisions,
              or summarize revenue circulars backed by published evidence.
            </p>

            <div className="space-y-2 pt-1 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-teal-700 shrink-0" aria-hidden="true" />
                <span>Grounded in indexed statutory revenue acts and circulars</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                <span>Evidence sufficiency safeguards prevent speculative answers</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/assistant"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-2xs hover:bg-teal-900 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-700"
              >
                <Bot className="h-4 w-4" aria-hidden="true" />
                <span>Ask Statutory Assistant</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Right Column: Clickable Example Questions */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 pb-1">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                <span>Example Inquiries</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Click to launch in assistant</span>
            </div>

            <div className="space-y-2.5">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <Link
                  key={idx}
                  to={`/assistant?q=${encodeURIComponent(q)}`}
                  className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-teal-300 hover:bg-teal-50/40 transition text-left"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-900 shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                      "{q}"
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-teal-700 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 leading-normal pt-1">
              Statutory research prototype · AI synthesis is grounded in indexed documents and does not constitute formal legal counsel. Official determinations require confirmation from relevant revenue authorities.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
