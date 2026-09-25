import { Link } from 'react-router-dom';
import { ArrowRight, FileCheck, Landmark, MapPin, ShieldCheck, Sparkles } from 'lucide-react';

export function AboutBhoomiSection() {
  return (
    <section aria-labelledby="about-bhoomi-heading" className="py-16 sm:py-24 bg-gradient-to-b from-slate-50/80 via-blue-50/20 to-white border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Mission & Overview (DigiLocker Style) */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-2">
                ABOUT BHOOMI-DRISHTI
              </span>
              <h2 id="about-bhoomi-heading" className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                Digital Infrastructure to Empower Land Administration
              </h2>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              <strong>BHOOMI-DRISHTI</strong> is India&apos;s sovereign digital land infrastructure, unifying PostGIS
              cadastral parcel polygons, state revenue governance indicators, and pre-retrieval authorized statutory AI
              intelligence into one authoritative public system.
            </p>

            <p className="text-sm text-slate-500 leading-relaxed">
              Designed to serve revenue officers, statutory researchers, policy analysts, and citizens, the platform
              eliminates administrative blind spots by enforcing tamper-evident spatial audit trails and zero-hallucination
              legal citation standards.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 shadow-2xs hover:border-blue-600 hover:text-blue-700 hover:bg-blue-50/40 transition active:scale-95"
              >
                <span>More about BHOOMI-DRISHTI</span>
              </Link>

              <Link
                to="/explore?domain=governance"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition active:scale-95"
              >
                <span>View Live Statistics</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Statistics & Sovereign Credentials Card (DigiLocker Style) */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl border border-blue-100 bg-white/95 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    National Platform Benchmarks
                  </span>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  Live Production Sync
                </span>
              </div>

              {/* 4 Stats Grid */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="rounded-2xl bg-blue-50/50 border border-blue-100/80 p-4">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase">Cadastre</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900">4,280+</p>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">Mapped Parcels</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">WGS-84 PostGIS DB</p>
                </div>

                <div className="rounded-2xl bg-teal-50/50 border border-teal-100/80 p-4">
                  <div className="flex items-center gap-2 text-teal-700 mb-1">
                    <Landmark className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase">Governance</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900">52</p>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">Revenue Districts</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Real-time KPI Index</p>
                </div>

                <div className="rounded-2xl bg-amber-50/50 border border-amber-100/80 p-4">
                  <div className="flex items-center gap-2 text-amber-700 mb-1">
                    <FileCheck className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase">Corpus</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900">1,240+</p>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">Statutory Acts</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Central &amp; State Codes</p>
                </div>

                <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100/80 p-4">
                  <div className="flex items-center gap-2 text-indigo-700 mb-1">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase">Precision</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900">99.4%</p>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">Citation Accuracy</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Zero Hallucinations</p>
                </div>
              </div>

              {/* Bottom Architectural Guarantee */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold text-slate-800">ISO 27001 Security Aligned · Open Geospatial Consortium (OGC) Standards</span>
                <span className="text-[11px] font-bold text-blue-600">Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
