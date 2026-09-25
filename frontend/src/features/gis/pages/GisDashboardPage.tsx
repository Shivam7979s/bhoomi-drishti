import { useState, useEffect, useRef, useCallback } from 'react';
import { LeafletMap } from '../components/LeafletMap';
import { GisFilterPanel } from '../components/GisFilterPanel';
import { MapLegend } from '../components/MapLegend';
import { ParcelDetailsDrawer } from '../components/ParcelDetailsDrawer';
import {
  fetchGisFilterOptions,
  fetchLandRecordsGeoJson,
} from '../services/gisService';
import type {
  GeoJsonFeature,
  GisFilterOptions,
  GisFilterParams,
} from '../types/gis';
import { AlertCircle, Filter, RefreshCw } from 'lucide-react';

export function GisDashboardPage() {
  // Map and layer states
  const [features, setFeatures] = useState<GeoJsonFeature[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<GeoJsonFeature | null>(null);
  const [focusFeature, setFocusFeature] = useState<GeoJsonFeature | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Viewport metadata
  const [truncated, setTruncated] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [returnedCount, setReturnedCount] = useState(0);
  const [zoomThresholdMet, setZoomThresholdMet] = useState(true);

  // Viewport state
  const [currentBbox, setCurrentBbox] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(13);

  // Filter state
  const [filterOptions, setFilterOptions] = useState<GisFilterOptions>({
    states: [],
    districts: [],
    tehsils: [],
    villages: [],
    landUseTypes: [],
    ownershipTypes: [],
    statuses: [],
  });
  const [activeFilters, setActiveFilters] = useState<GisFilterParams>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Abort controller ref for in-flight cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch filter dropdown options on mount
  useEffect(() => {
    fetchGisFilterOptions()
      .then((opts) => setFilterOptions(opts))
      .catch((err) => {
        console.warn('Failed to load GIS filter options:', err);
      });
  }, []);

  // Viewport query handler
  const loadParcels = useCallback(
    async (bbox: string, zoom: number, filters: GisFilterParams) => {
      // Zoom guard: Cadastral parcel polygons only query at zoom >= 12
      if (zoom < 12) {
        setFeatures([]);
        setTruncated(false);
        setTotalCount(0);
        setReturnedCount(0);
        setZoomThresholdMet(false);
        setLoading(false);
        return;
      }

      // Abort any prior pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);
      setZoomThresholdMet(true);

      try {
        const data = await fetchLandRecordsGeoJson(
          {
            ...filters,
            bbox,
            limit: 500,
          },
          controller.signal,
        );

        setFeatures(data.features || []);
        setTotalCount(data.totalCount || 0);
        setReturnedCount(data.returnedCount || 0);
        setTruncated(Boolean(data.truncated));
      } catch (err: any) {
        if (err.name === 'AbortError' || err.message?.includes('aborted')) {
          // Request was cancelled by map movement - benign
          return;
        }
        console.error('Failed to load cadastral parcels for viewport:', err);
        setError(err.message || 'Failed to load parcels for this viewport');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Trigger load when bbox, zoom, or filters change
  useEffect(() => {
    if (currentBbox) {
      loadParcels(currentBbox, currentZoom, activeFilters);
    }
  }, [currentBbox, currentZoom, activeFilters, loadParcels]);

  const handleViewportChange = (bbox: string, zoom: number) => {
    setCurrentBbox(bbox);
    setCurrentZoom(zoom);
  };

  const handleFilterChange = (newFilters: GisFilterParams) => {
    setActiveFilters(newFilters);
  };

  const handleResetFilters = () => {
    setActiveFilters({});
  };

  const handleSelectFeature = (feature: GeoJsonFeature | null) => {
    setSelectedFeature(feature);
  };

  const handleZoomToParcel = (feature: GeoJsonFeature) => {
    setFocusFeature(feature);
  };

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-900">
      {/* Interactive Map Canvas */}
      <div className="relative flex-1 h-full w-full">
        <LeafletMap
          features={features}
          selectedFeature={selectedFeature}
          onSelectFeature={handleSelectFeature}
          onViewportChange={handleViewportChange}
          loading={loading}
          truncated={truncated}
          totalCount={totalCount}
          returnedCount={returnedCount}
          zoomThresholdMet={zoomThresholdMet}
          focusFeature={focusFeature}
        />

        {/* Floating Filter Toggle Button (Top-Left) */}
        <div className="absolute top-4 left-4 z-20">
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold shadow-md transition backdrop-blur-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 ${
              isFilterOpen || activeFilterCount > 0
                ? 'border-emerald-700 bg-emerald-800 text-white hover:bg-emerald-900'
                : 'border-slate-200 bg-white/95 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            <span>GIS Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible Filter Panel Floating on Left */}
        {isFilterOpen && (
          <div className="absolute top-16 left-4 z-20 w-80 sm:w-88 max-h-[calc(100%-5rem)] shadow-xl rounded-2xl">
            <GisFilterPanel
              filters={activeFilters}
              filterOptions={filterOptions}
              onFilterChange={(newFilters) => handleFilterChange({ ...activeFilters, ...newFilters })}
              onResetFilters={handleResetFilters}
              isLoading={loading}
              onClose={() => setIsFilterOpen(false)}
            />
          </div>
        )}

        {/* Floating Map Legend (Bottom-Right) */}
        <div className="absolute bottom-6 right-4 z-20 shadow-md rounded-2xl">
          <MapLegend />
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/95 px-4 py-2.5 text-xs font-medium text-rose-900 shadow-xl backdrop-blur-xs">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" aria-hidden="true" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => currentBbox && loadParcels(currentBbox, currentZoom, activeFilters)}
              className="ml-2 inline-flex items-center gap-1 font-bold text-rose-800 hover:text-rose-950 underline"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" /> Retry
            </button>
          </div>
        )}

        {/* Selected Parcel Details Drawer (Right Slide-over) */}
        <ParcelDetailsDrawer
          feature={selectedFeature}
          onClose={() => setSelectedFeature(null)}
          onZoomToParcel={handleZoomToParcel}
        />
      </div>
    </div>
  );
}
