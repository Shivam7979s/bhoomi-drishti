import { Link } from 'react-router-dom';
import { ArrowRight, Code2, Database, Handshake } from 'lucide-react';

export function PartnerIntegrationSection() {
  return (
    <section aria-labelledby="partner-heading" className="py-16 sm:py-20 bg-slate-50/70 border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Card 1: Partner Organization (DigiLocker Style) */}
          <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-10 text-white shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xs">
                <Handshake className="h-6 w-6 text-white" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200 block mb-1">
                  Institutional Integration
                </span>
                <h3 id="partner-heading" className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Become a Partner Organization
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                Connect your State Revenue Department, Land Survey Directorate, or Legal Research Institute to publish
                authoritative cadastral records, gazettes, and dispute resolution indices.
              </p>
            </div>

            <div className="pt-6">
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs sm:text-sm font-bold text-blue-900 shadow-md hover:bg-blue-50 transition active:scale-95"
              >
                <span>Partner Integration Guidelines</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Open Spatial Data & API Ecosystem (DigiLocker API / App Style) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <Code2 className="h-6 w-6 text-slate-800" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                  Open Standards &amp; Interoperability
                </span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Open Spatial Cadastre &amp; Vector APIs
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Access machine-readable WGS-84 PostGIS spatial boundaries via OGC Web Feature Services (WFS) and query
                1,240+ vectorized statutory acts via FastEmbed 384-dimensional semantic endpoints.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {['OGC WFS / WMS', 'PostGIS 3.5', 'FastEmbed 384-D', 'JSON-LD'].map((tag) => (
                  <span key={tag} className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-6 py-3 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-100 hover:text-blue-700 transition active:scale-95"
              >
                <Database className="h-4 w-4 text-slate-500" />
                <span>Explore Open Data Standards</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
