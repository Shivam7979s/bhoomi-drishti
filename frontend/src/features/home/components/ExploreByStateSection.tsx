import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';

const STATES = [
  {
    name: 'Madhya Pradesh',
    hindi: 'मध्य प्रदेश',
    districts: '52 Districts',
    coverage: 'PostGIS Live Spatial Sync',
    code: 'MP',
    color: 'from-blue-600 to-indigo-700',
    to: '/explore?state=Madhya+Pradesh',
  },
  {
    name: 'Rajasthan',
    hindi: 'राजस्थान',
    districts: '33 Districts',
    coverage: 'Land Revenue Code 1956',
    code: 'RJ',
    color: 'from-amber-600 to-orange-700',
    to: '/explore?state=Rajasthan',
  },
  {
    name: 'Uttar Pradesh',
    hindi: 'उत्तर प्रदेश',
    districts: '75 Districts',
    coverage: 'UP Revenue Code 2006',
    code: 'UP',
    color: 'from-teal-600 to-emerald-700',
    to: '/explore?state=Uttar+Pradesh',
  },
  {
    name: 'Maharashtra',
    hindi: 'महाराष्ट्र',
    districts: '36 Districts',
    coverage: 'MLR Code & 7/12 Records',
    code: 'MH',
    color: 'from-purple-600 to-indigo-800',
    to: '/explore?state=Maharashtra',
  },
  {
    name: 'Gujarat',
    hindi: 'गुजरात',
    districts: '33 Districts',
    coverage: 'E-Dhara Cadastral System',
    code: 'GJ',
    color: 'from-sky-600 to-blue-800',
    to: '/explore?state=Gujarat',
  },
  {
    name: 'Karnataka',
    hindi: 'कर्नाटक',
    districts: '31 Districts',
    coverage: 'Bhoomi RTC Digital Sync',
    code: 'KA',
    color: 'from-emerald-600 to-teal-800',
    to: '/explore?state=Karnataka',
  },
  {
    name: 'Odisha',
    hindi: 'ओडिशा',
    districts: '30 Districts',
    coverage: 'Bhulekh Cadastre & Reforms',
    code: 'OD',
    color: 'from-rose-600 to-pink-800',
    to: '/explore?state=Odisha',
  },
  {
    name: 'Bihar',
    hindi: 'बिहार',
    districts: '38 Districts',
    coverage: 'Bihar Mutation & Survey Act',
    code: 'BR',
    color: 'from-indigo-600 to-purple-800',
    to: '/explore?state=Bihar',
  },
];

export function ExploreByStateSection() {
  return (
    <section aria-labelledby="state-explore-heading" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header (DigiLocker Style: Explore Documents by State) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
              Geographic Coverage
            </span>
            <h2 id="state-explore-heading" className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Explore Land Records by State
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Access state revenue codes, cadastral boundaries, and district mutation indices tailored to state-specific statutory frameworks.
            </p>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 transition shrink-0 group"
          >
            <span>View All States &amp; UTs</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* State Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {STATES.map((state) => (
            <Link
              key={state.code}
              to={state.to}
              className="group flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* State Crest Emblem Box */}
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${state.color} text-white font-black text-sm shadow-xs group-hover:scale-105 transition-transform`}>
                  {state.code}
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {state.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {state.districts} · <span className="text-blue-600 font-semibold">{state.hindi}</span>
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold truncate mt-0.5">
                    ● {state.coverage}
                  </p>
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
