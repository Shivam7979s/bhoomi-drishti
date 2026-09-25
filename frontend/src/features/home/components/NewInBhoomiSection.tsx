import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  FileCheck,
  Landmark,
  Layers,
  Scale,
  TrendingUp,
} from 'lucide-react';

const SERVICES = [
  {
    id: 'registered-deed',
    title: 'Registered Deed & Mutation Status',
    category: 'Cadastral Records',
    description: 'Instant electronic lookup of registered land deeds, mutation notices, and khasra survey verification numbers.',
    badge: 'Live Cadastre',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: FileCheck,
    iconColor: 'text-emerald-700 bg-emerald-50',
    to: '/explore?domain=cadastral',
  },
  {
    id: 'rfctlarr',
    title: 'RFCTLARR Land Acquisition Act, 2013',
    category: 'Statutory Act',
    description: 'Verbatim statutory rules on rural compensation multipliers, 100% Solatium allowance, and rehabilitation entitlements.',
    badge: 'Central Act',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Scale,
    iconColor: 'text-blue-700 bg-blue-50',
    to: '/explore?q=RFCTLARR',
  },
  {
    id: 'leasing-act',
    title: 'Model Agricultural Land Leasing Rules',
    category: 'Tenancy Policy',
    description: 'Statutory framework protecting landowners while granting institutional credit and crop compensation to tenant farmers.',
    badge: 'Model Policy',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Landmark,
    iconColor: 'text-purple-700 bg-purple-50',
    to: '/explore?q=leasing',
  },
  {
    id: 'dilrmp',
    title: 'DILRMP Cadastral Modernization',
    category: 'National Standard',
    description: 'Standard operating procedures for computerized land records, drone-based resurvey, and spatial cadastral registration.',
    badge: 'Digitization',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Layers,
    iconColor: 'text-amber-700 bg-amber-50',
    to: '/explore?q=DILRMP',
  },
  {
    id: 'governance-index',
    title: 'District Mutation Velocity & Pendency',
    category: 'Revenue Index',
    description: 'Monitor administrative disposal rates, pending mutation applications, and compliance scores across 52 districts.',
    badge: 'KPI Index',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: TrendingUp,
    iconColor: 'text-teal-700 bg-teal-50',
    to: '/explore?domain=governance',
  },
  {
    id: 'statutory-ai',
    title: 'Evidence-Grounded AI Legal Search',
    category: 'Legal AI',
    description: 'Ask questions on state land revenue acts with guaranteed verbatim citations and strict pre-retrieval authorization.',
    badge: 'AI Grounded',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: Bot,
    iconColor: 'text-indigo-700 bg-indigo-50',
    to: '/explore?domain=assistant',
  },
];

export function NewInBhoomiSection() {
  return (
    <section aria-labelledby="new-in-bhoomi-heading" className="py-12 sm:py-16 bg-white border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header (DigiLocker Style: "New in DigiLocker") */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
              Public Land Records &amp; Instruments
            </span>
            <h2 id="new-in-bhoomi-heading" className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              New in BHOOMI-DRISHTI
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Recently digitized land records, statutory circulars, and core governance indices available for public exploration.
            </p>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 transition shrink-0 group"
          >
            <span>View All Datasets ({SERVICES.length}+)</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Horizontal Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.to}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 hover:-translate-y-1"
              >
                <div className="space-y-3">
                  {/* Top card header */}
                  <div className="flex items-center justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconColor} group-hover:scale-105 transition-transform`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                  <span>Explore Dataset</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
