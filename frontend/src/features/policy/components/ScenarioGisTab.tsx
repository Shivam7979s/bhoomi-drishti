import { useState, useRef, useCallback } from 'react';
import { LeafletMap } from '../../gis/components/LeafletMap';
import { ParcelDetailsDrawer } from '../../gis/components/ParcelDetailsDrawer';
import { fetchLandRecordsGeoJson } from '../../gis/services/gisService';
import type { GeoJsonFeature, GisFilterParams } from '../../gis/types/gis';
import type { PolicyScenario, SpatialSummary } from '../types/policy';
import { AlertCircle, Layers, MapPin, RefreshCw, ZoomIn } from 'lucide-react';

interface ScenarioGisTabProps {
  scenario: PolicyScenario;
}

export function ScenarioGisTab({ scenario }: ScenarioGisTabProps) {
  const [features, setFeatures] = useState<GeoJsonFeature[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<GeoJsonFeature | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [returnedCount, setReturnedCount] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [zoomThresholdMet, setZoomThresholdMet] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Parse spatial summary defensively
  let spatialSummary: SpatialSummary | null = null;
  if (scenario.latestResult?.spatialSummaryJson) {
    try {
      spatialSummary = JSON.parse(scenario.latestResult.spatialSummaryJson);
    } catch (e) {
      console.warn('Failed to parse spatialSummaryJson', e);
    }
  }

  const p = scenario.parameters;
  const targetLocation = [p.targetVillage, p.targetTehsil, p.targetDistrict, p.targetState]
    .filter(Boolean)
    .join(', ');

  const loadParcels = useCallback(
    async (bbox: string, zoom: number) => {
      if (zoom < 12) {
        setFeatures([]);
        setTruncated(false);
        setTotalCount(0);
        setReturnedCount(0);
        setZoomThresholdMet(false);
        setLoading(false);
        return;
      }

      setZoomThresholdMet(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      const params: GisFilterParams = {
        bbox,
        state: p.targetState || undefined,
        district: p.targetDistrict || undefined,
        tehsil: p.targetTehsil || undefined,
        village: p.targetVillage || undefined,
        limit: 300,
      };

      try {
        const fc = await fetchLandRecordsGeoJson(params, controller.signal);
        setFeatures(fc.features || []);
        setTotalCount(fc.totalCount || fc.features?.length || 0);
        setReturnedCount(fc.returnedCount || fc.features?.length || 0);
        setTruncated(fc.truncated || false);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err?.message || 'Failed to load cadastral records for this viewport.');
        }
      } finally {
        setLoading(false);
      }
    },
    [p.targetState, p.targetDistrict, p.targetTehsil, p.targetVillage],
  );

  const handleViewportChange = useCallback(
    (bbox: string, zoom: number) => {
      loadParcels(bbox, zoom);
    },
    [loadParcels],
  );

  return (
    <div className="space-y-4">
      {/* Notice & Scope Banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
        <div className="flex items-start gap-3">
          <Layers className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 leading-relaxed">
            <span className="font-semibold text-blue-950">Scenario Spatial Context: </span>
            This interactive map visualizes cadastral land parcels within the configured intervention zone.
            {targetLocation && (
              <span className="font-medium ml-1">
                Targeted region: <span className="underline">{targetLocation}</span>.
              </span>
            )}
            <p className="mt-1 text-blue-700">
              Note: Visible parcels represent all land records queried within the current viewport. Parcels are inspected in read-only mode with owner personal data masked according to statutory privacy rules.
            </p>
          </div>
        </div>
      </div>

      {/* Spatial Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-slate-800">
            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
            Parcels in View: <span className="font-bold text-slate-900">{returnedCount}</span>
            {totalCount > returnedCount && <span> (of {totalCount})</span>}
          </span>
          {spatialSummary?.boundingBox && (
            <span className="hidden sm:inline text-slate-500 font-mono text-[11px]">
              Extents: [{spatialSummary.boundingBox.minLon?.toFixed(3)}, {spatialSummary.boundingBox.minLat?.toFixed(3)}] to [{spatialSummary.boundingBox.maxLon?.toFixed(3)}, {spatialSummary.boundingBox.maxLat?.toFixed(3)}]
            </span>
          )}
        </div>

        {!zoomThresholdMet && (
          <span className="inline-flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded">
            <ZoomIn className="h-3.5 w-3.5" />
            Zoom in (level &ge; 12) to render cadastral boundaries
          </span>
        )}

        {loading && (
          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Loading parcels...
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* GIS Leaflet Map Container */}
      <div className="relative h-[550px] w-full overflow-hidden rounded-xl border border-slate-300 shadow-sm">
        <LeafletMap
          features={features}
          selectedFeature={selectedFeature}
          onSelectFeature={(feat) => setSelectedFeature(feat)}
          onViewportChange={handleViewportChange}
          loading={loading}
          truncated={truncated}
          totalCount={totalCount}
          returnedCount={returnedCount}
          zoomThresholdMet={zoomThresholdMet}
        />
      </div>

      {/* Parcel Details Drawer */}
      {selectedFeature && (
        <ParcelDetailsDrawer
          feature={selectedFeature}
          onClose={() => setSelectedFeature(null)}
        />
      )}
    </div>
  );
}
