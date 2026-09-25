import { ArrowRight, Bot, Compass, FileSearch, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

const STEPS = [
  {
    step: '01',
    title: 'Explore or Sign In',
    description: 'Use the open public portal to discover datasets or sign in for official revenue workflows.',
    icon: Compass,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    step: '02',
    title: 'Select Jurisdiction',
    description: 'Choose state, district, and tehsil across 52 revenue jurisdictions.',
    icon: Layers,
    color: 'text-teal-600 bg-teal-50 border-teal-200',
  },
  {
    step: '03',
    title: 'Fetch Cadastre or Acts',
    description: 'Access geo-referenced PostGIS parcel polygons, mutation status, or statutory gazettes.',
    icon: FileSearch,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    step: '04',
    title: 'Verify with AI Citations',
    description: 'Ask complex legal questions answered with verbatim section quotes and audit trails.',
    icon: Bot,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
];

export function GettingStartedSection() {
  return (
    <section aria-labelledby="getting-started-heading" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header (DigiLocker Style: Getting started is quick and easy) */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
            Simple 4-Step Verification
          </span>
          <h2 id="getting-started-heading" className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Getting Started is Quick and Easy
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            From citizen parcel lookups to district commissioner audit reviews in minutes.
          </p>
        </div>

        {/* Steps Grid with Connective Arrows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="relative flex flex-col items-center text-center rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs hover:shadow-md transition-shadow group"
              >
                {/* Step Number Badge */}
                <span className="absolute top-3 left-3 text-[10px] font-black text-slate-400 bg-slate-100 rounded-md px-2 py-0.5">
                  STEP {step.step}
                </span>

                {/* Step Icon */}
                <div className={`mt-3 flex h-16 w-16 items-center justify-center rounded-2xl border ${step.color} shadow-xs group-hover:scale-105 transition-transform`}>
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </div>

                {/* Title & Description */}
                <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {step.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {step.description}
                </p>

                {/* Desktop Arrow to next step */}
                {idx < STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 border border-slate-200">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Start Exploring Action */}
        <div className="mt-10 text-center">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-8 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition active:scale-95"
          >
            <span>Start Exploring Now</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
