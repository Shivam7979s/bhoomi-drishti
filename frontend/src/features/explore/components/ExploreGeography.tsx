import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, MapPin, ShieldAlert } from 'lucide-react';
import type { GisFilterOptions } from '../../gis/types/gis';

interface ExploreGeographyProps {
  gisOptions: GisFilterOptions | null;
  isLoading: boolean;
  error: string | null;
}

export function ExploreGeography({
  gisOptions,
  isLoading,
  error,
}: ExploreGeographyProps) {
  const hasLiveStates = Boolean(gisOptions?.states && gisOptions.states.length > 0);
  const coveredStates = hasLiveStates ? gisOptions!.states : ['Madhya Pradesh'];

  const [selectedState, setSelectedState] = useState<string>(coveredStates[0] || 'Madhya Pradesh');

  const hasLiveDistricts = Boolean(gisOptions?.districts && gisOptions.districts.length > 0);
  const sampleDistricts = hasLiveDistricts
    ? gisOptions!.districts
    : ['Bhopal', 'Sehore', 'Raisen', 'Rajgarh', 'Vidisha'];

  return (
    <section id="explore-geography" aria-labelledby="geography-heading" className="scroll-mt-20 space-y-8">
      {/* Section Header */}
      <div className="text-left space-y-2 border-b border-slate-200/80 pb-5">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
          Geospatial Hierarchy
        </span>
        <h2 id="geography-heading" className="text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
          Explore by Administrative Geography
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
          Navigate statutory governance metrics and cadastral boundaries across multi-tier administrative revenue jurisdictions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Spatial Levels Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Compass className="h-4 w-4 text-blue-700" aria-hidden="true" />
              <span>Multi-Tier Spatial Cadastre Hierarchy</span>
            </h3>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-800 shrink-0">
                  L1
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">State Revenue Board</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Broad policy circulars, statutory revenue acts, and state-wide digitization benchmarks.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-800 shrink-0">
                  L2
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">District & Tehsil Circles</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mutation velocity metrics, revenue dispute caseloads, and survey milestones.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-800 shrink-0">
                  L3
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Village Cadastral Polygons</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    PostGIS geometries, survey parcel identifiers, and land-use classifications.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/gis"
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-blue-800 px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-900 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                <Compass className="h-4 w-4" aria-hidden="true" />
                <span>Launch Interactive GIS Map</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Jurisdiction Explorer Card */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Configured Geographic Coverage</h3>
                <p className="text-xs text-slate-500 mt-0.5">Filter active jurisdictions or explore district-level cadastre</p>
              </div>
              <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-blue-900 uppercase">
                EPSG:4326 · WGS-84
              </span>
            </div>

            {/* State Selection */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                {hasLiveStates ? 'Active State Jurisdictions (Database)' : 'Example State Jurisdictions (Illustrative)'}
              </span>

              {isLoading ? (
                <div className="h-9 w-40 bg-slate-200 rounded-lg animate-pulse" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {coveredStates.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedState(st)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold transition ${
                        selectedState === st
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-900 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                      <span>{st}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* District Pills with direct GIS link */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                {hasLiveDistricts ? 'Configured Administrative Districts' : 'Example Administrative Districts (Illustrative)'}
              </span>

              {isLoading ? (
                <div className="flex flex-wrap gap-2 animate-pulse">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-8 w-24 bg-slate-200 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {sampleDistricts.map((dst) => (
                      <Link
                        key={dst}
                        to={`/gis?state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(dst)}`}
                        className="group inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40 hover:text-emerald-950 transition"
                      >
                        <MapPin className="h-3 w-3 text-slate-400 group-hover:text-emerald-700 transition-colors" aria-hidden="true" />
                        <span>{dst}</span>
                        <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>

                  {!hasLiveDistricts && (
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Illustrative regional hierarchy. Live boundary polygons and revenue court registers populate dynamically from PostGIS tables upon deployment.
                    </p>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
                <span>Note: Geographic filter synchronization requires operational backend connectivity.</span>
              </div>
            )}

            {/* Spatial Technical Notice */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs text-slate-600 flex items-start gap-3">
              <ShieldAlert className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-[11px] leading-relaxed">
                PostGIS spatial indexing serves cadastral polygons using bounding-box clipping and zoom-threshold geometry simplification, preserving browser client performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
