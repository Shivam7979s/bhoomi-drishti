import { CheckSquare, Database, FileSearch, LineChart } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Discover & Map',
    icon: Database,
    description: 'Provides a spatial framework to map cadastral parcels, land use zoning, and administrative revenue hierarchies.',
  },
  {
    step: '02',
    title: 'Analyze & Benchmark',
    icon: LineChart,
    description: 'Enables structured calculation of revenue administration indicators, dispute status shares, and digitization metrics.',
  },
  {
    step: '03',
    title: 'Ground with Evidence',
    icon: FileSearch,
    description: 'Connects indicators and AI synthesis with published acts, policy circulars, and legal documents.',
  },
  {
    step: '04',
    title: 'Support Decisions',
    icon: CheckSquare,
    description: 'Supports researchers, officers, and public users with transparent, evidence-backed land intelligence.',
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
            Platform Workflow
          </span>
          <h2 id="how-it-works-heading" className="text-2xl font-black text-slate-900 sm:text-4xl tracking-tight">
            How BHOOMI-DRISHTI Works
          </h2>
          <p className="text-sm text-slate-600 sm:text-base leading-relaxed">
            A cohesive data pipeline bridging cadastral polygons with statutory revenue evidence.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-2xs space-y-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-emerald-800 tracking-wider">
                    {s.step}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-800">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
