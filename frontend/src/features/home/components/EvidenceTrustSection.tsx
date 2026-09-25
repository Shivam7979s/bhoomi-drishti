import { CheckCircle2, FileCheck, Lock, ShieldCheck } from 'lucide-react';

const TRUST_PILLARS = [
  {
    icon: FileCheck,
    title: 'Source-Linked Citations',
    description: 'Indicators and AI assistant findings reference indexed policy documents and cadastral records where available.',
  },
  {
    icon: ShieldCheck,
    title: 'Immutable Audit Snapshots',
    description: 'Calculations can be frozen as point-in-time snapshots for reproducible temporal audit comparisons.',
  },
  {
    icon: Lock,
    title: 'Pre-Retrieval Security Gate',
    description: 'Security rules validate user project membership and role permissions before semantic retrieval commences.',
  },
  {
    icon: CheckCircle2,
    title: 'Open Standard Technology',
    description: 'Built on PostgreSQL + PostGIS spatial database, Spring Boot services, and FastEmbed dense vector retrieval.',
  },
];

export function EvidenceTrustSection() {
  return (
    <section aria-labelledby="trust-heading" className="py-16 sm:py-20 bg-slate-50/70 border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
            Trust & Integrity
          </span>
          <h2 id="trust-heading" className="text-2xl font-black text-slate-900 sm:text-4xl tracking-tight">
            Evidence-Backed by Design
          </h2>
          <p className="text-sm text-slate-600 sm:text-base leading-relaxed">
            Engineered around verifiable provenance, statutory citation integrity, and strict access boundaries.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-3 text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{p.title}</h3>
                <p className="text-xs leading-relaxed text-slate-600">{p.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
