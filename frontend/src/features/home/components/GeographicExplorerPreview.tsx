import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Layers, MapPin, ShieldAlert } from 'lucide-react';
import type { GisFilterOptions } from '../../gis/types/gis';

interface GeographicExplorerPreviewProps {
  gisOptions: GisFilterOptions | null;
  isLoading: boolean;
}

export function GeographicExplorerPreview({
  gisOptions,
  isLoading,
}: GeographicExplorerPreviewProps) {
  const hasLiveStates = Boolean(gisOptions?.states && gisOptions.states.length > 0);
  const coveredStates = hasLiveStates ? gisOptions!.states : ['Madhya Pradesh'];
  const hasLiveDistricts = Boolean(gisOptions?.districts && gisOptions.districts.length > 0);
  const sampleDistricts = hasLiveDistricts ? gisOptions!.districts.slice(0, 4) : ['Bhopal', 'Sehore', 'Raisen', 'Rajgarh'];

  return (
    <section aria-labelledby="geographic-heading" className="py-16 sm:py-20 bg-slate-50/70 border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Spatial Narrative & Hierarchy */}
          <div className="space-y-6 text-left lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-900 border border-blue-200/80">
              <Compass className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
              <span>Multi-Tier Spatial Cadastre</span>
            </div>

            <h2 id="geographic-heading" className="text-2xl font-black text-slate-900 sm:text-4xl tracking-tight">
              Explore Land Governance by Geography
            </h2>

            <p className="text-sm sm:text-base leading-relaxed text-slate-600">
              From state revenue boards to district collectorates, tehsil circles, and village cadastral polygons —
              BHOOMI-DRISHTI bridges administrative indicators with geospatial ground realities.
            </p>

            {/* Spatial Hierarchy Steps */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs shrink-0">
                  L1
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">State Revenue Board Oversight</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Broad policy circulars, statutory revenue codes, and state-wide digitization benchmarks.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-800 font-bold text-xs shrink-0">
                  L2
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">District & Tehsil Revenue Circles</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mutation velocity metrics, revenue court dispute queues, and survey settlement milestones.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-bold text-xs shrink-0">
                  L3
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Village Cadastral Parcel Polygons</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    PostGIS geometries, survey parcel identifiers, agricultural/residential zoning, and deed links.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/gis"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-800 px-5 py-3 text-xs font-bold text-white shadow-2xs hover:bg-blue-900 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                <span>Launch Interactive GIS Map</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link
                to="/land-records"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              >
                <Layers className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span>Cadastral Records Registry</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Geographic Jurisdiction Summary Card */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Geographic Spatial Scope</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Authorized PostGIS boundaries configured in system</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                  WGS-84 EPSG:4326
                </span>
              </div>

              {/* State Pills */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  {hasLiveStates ? 'Active State Jurisdictions (Database)' : 'Example State Jurisdictions (Illustrative)'}
                </span>
                {isLoading ? (
                  <div className="flex gap-2 animate-pulse">
                    <div className="h-8 w-32 rounded-lg bg-slate-200" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {coveredStates.map((st) => (
                      <span
                        key={st}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900"
                      >
                        <MapPin className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                        <span>{st}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* District Sample Pills */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  {hasLiveDistricts ? 'Configured Administrative Districts' : 'Example Administrative Districts (Illustrative)'}
                </span>
                {isLoading ? (
                  <div className="flex gap-2 animate-pulse">
                    <div className="h-7 w-20 rounded-lg bg-slate-200" />
                    <div className="h-7 w-20 rounded-lg bg-slate-200" />
                    <div className="h-7 w-20 rounded-lg bg-slate-200" />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-2">
                      {sampleDistricts.map((dst) => (
                        <span
                          key={dst}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                        >
                          {dst}
                        </span>
                      ))}
                      {gisOptions && gisOptions.districts.length > 4 && (
                        <span className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-500">
                          +{gisOptions.districts.length - 4} more districts
                        </span>
                      )}
                    </div>
                    {!hasLiveDistricts && (
                      <p className="text-[10px] text-slate-400 pt-0.5">
                        Illustrative regional hierarchy. Live boundary polygons populate dynamically from spatial database.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Spatial Technical Provenance Notice */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-xs text-slate-600 flex items-start gap-3">
                <ShieldAlert className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="leading-relaxed text-[11px]">
                  Cadastral boundaries are served dynamically from PostGIS geometry tables with multi-tier bounding-box clipping and zoom-threshold spatial indexing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
