import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  AlertCircle,
  Filter,
  RefreshCw,
  Compass,
  ChevronRight,
  MapPin,
  Layers,
  Eye,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Navigation,
} from 'lucide-react';

export function GisDashboardPage() {
  const { t } = useLanguage();
  const { activeRole } = useAuth();
  const isOfficial = activeRole === 'GOVERNMENT_OFFICIAL' || activeRole === 'ADMIN';

  // Map and layer states
  const [features, setFeatures] = useState<GeoJsonFeature[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<GeoJsonFeature | null>(null);
  const [focusFeature, setFocusFeature] = useState<GeoJsonFeature | null>(null);
  const [targetFlyTo, setTargetFlyTo] = useState<{ center: [number, number]; zoom: number; id: string } | null>(null);
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

  // 5-State Nationwide Cadastre Presets (466 Total Real Polygons across 11 Districts)
  interface CadastrePreset {
    id: string;
    state: string;
    stateCode: string;
    district: string;
    tehsil?: string;
    label: string;
    center: [number, number];
    zoom: number;
    count: number;
  }

  const NATIONWIDE_CADASTRE_PRESETS: CadastrePreset[] = [
    // ── Madhya Pradesh (126 Parcels) ──
    {
      id: 'bhopal',
      state: 'Madhya Pradesh',
      stateCode: 'MP',
      district: 'Bhopal',
      tehsil: 'Huzur',
      label: 'Bhopal (Huzur)',
      center: [23.2292, 77.4337],
      zoom: 13.5,
      count: 62,
    },
    {
      id: 'indore',
      state: 'Madhya Pradesh',
      stateCode: 'MP',
      district: 'Indore',
      tehsil: 'Rau',
      label: 'Indore (Rau)',
      center: [22.7499, 75.8824],
      zoom: 13.5,
      count: 52,
    },
    {
      id: 'sehore',
      state: 'Madhya Pradesh',
      stateCode: 'MP',
      district: 'Sehore',
      tehsil: 'Phanda',
      label: 'Sehore (Phanda)',
      center: [23.1949, 77.1087],
      zoom: 13.5,
      count: 12,
    },

    // ── Maharashtra (85 Parcels) ──
    {
      id: 'pune',
      state: 'Maharashtra',
      stateCode: 'MH',
      district: 'Pune',
      tehsil: 'Haveli',
      label: 'Pune (Haveli)',
      center: [18.5272, 73.8489],
      zoom: 13.5,
      count: 50,
    },
    {
      id: 'nashik',
      state: 'Maharashtra',
      stateCode: 'MH',
      district: 'Nashik',
      tehsil: 'Dindori',
      label: 'Nashik (Dindori)',
      center: [19.9996, 73.7945],
      zoom: 13.5,
      count: 35,
    },

    // ── Uttar Pradesh (85 Parcels) ──
    {
      id: 'lucknow',
      state: 'Uttar Pradesh',
      stateCode: 'UP',
      district: 'Lucknow',
      tehsil: 'Mohanlalganj',
      label: 'Lucknow (Mohanlalganj)',
      center: [26.8277, 80.9372],
      zoom: 13.5,
      count: 50,
    },
    {
      id: 'varanasi',
      state: 'Uttar Pradesh',
      stateCode: 'UP',
      district: 'Varanasi',
      tehsil: 'Pindra',
      label: 'Varanasi (Pindra)',
      center: [25.3315, 82.9822],
      zoom: 13.5,
      count: 35,
    },

    // ── Rajasthan (85 Parcels) ──
    {
      id: 'jaipur',
      state: 'Rajasthan',
      stateCode: 'RJ',
      district: 'Jaipur',
      tehsil: 'Sanganer',
      label: 'Jaipur (Sanganer)',
      center: [26.8990, 75.8007],
      zoom: 13.5,
      count: 50,
    },
    {
      id: 'alwar',
      state: 'Rajasthan',
      stateCode: 'RJ',
      district: 'Alwar',
      tehsil: 'Ramgarh',
      label: 'Alwar (Ramgarh)',
      center: [27.5576, 76.6073],
      zoom: 13.5,
      count: 35,
    },

    // ── Karnataka (85 Parcels) ──
    {
      id: 'bengaluru-rural',
      state: 'Karnataka',
      stateCode: 'KA',
      district: 'Bengaluru Rural',
      tehsil: 'Devanahalli',
      label: 'Bengaluru Rural (Devanahalli)',
      center: [13.2184, 77.6939],
      zoom: 13.5,
      count: 50,
    },
    {
      id: 'mysuru',
      state: 'Karnataka',
      stateCode: 'KA',
      district: 'Mysuru',
      tehsil: 'Nanjangud',
      label: 'Mysuru (Nanjangud)',
      center: [12.2977, 76.6624],
      zoom: 13.5,
      count: 35,
    },
  ];

  const STATE_FILTER_TABS = [
    { code: 'ALL', label: 'All States', count: 466 },
    { code: 'MP', label: 'Madhya Pradesh', count: 126 },
    { code: 'MH', label: 'Maharashtra', count: 85 },
    { code: 'UP', label: 'Uttar Pradesh', count: 85 },
    { code: 'RJ', label: 'Rajasthan', count: 85 },
    { code: 'KA', label: 'Karnataka', count: 85 },
  ];

  const [selectedStateTab, setSelectedStateTab] = useState<string>('ALL');
  const [activePresetId, setActivePresetId] = useState<string>('bhopal');

  const filteredPresets = selectedStateTab === 'ALL'
    ? NATIONWIDE_CADASTRE_PRESETS
    : NATIONWIDE_CADASTRE_PRESETS.filter((p) => p.stateCode === selectedStateTab);


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

  const handleSelectPreset = (preset: CadastrePreset) => {
    setActivePresetId(preset.id);
    setSelectedStateTab(preset.stateCode);
    setTargetFlyTo({
      center: preset.center,
      zoom: preset.zoom,
      id: `${preset.id}-${Date.now()}`,
    });
    // Clear conflicting manual filters so the full regional dataset displays
    setActiveFilters({});
  };

  const handleResetToOverview = () => {
    setActiveFilters({});
    setSelectedStateTab('ALL');
    setActivePresetId('bhopal');
    setTargetFlyTo({
      center: [23.2292, 77.4337],
      zoom: 13,
      id: `reset-${Date.now()}`,
    });
  };

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      {/* ── Breadcrumb & Sovereign Header Bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5">
            <Link to="/dashboard" className="flex items-center gap-1 hover:text-emerald-700 transition">
              <span>{t.gisPage.breadcrumbHome}</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-emerald-900 font-bold">{t.gisPage.breadcrumbCurrent}</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {t.gisPage.pageTitle}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 shadow-2xs">
              <Compass className="h-3.5 w-3.5 text-emerald-600" />
              <span>PostGIS EPSG:4326</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 shadow-2xs">
              <span>DILRMP Cadastre</span>
            </span>
            {isOfficial ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 shadow-2xs">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>Official Mode: Full Title Deeds</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 shadow-2xs"
                title="Owner PII is redacted for public citizens per DPDP Act 2023"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                <span>Citizen View: PII Redacted</span>
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600 max-w-3xl">
            {t.gisPage.pageSubtitle}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold shadow-xs transition ${
              isFilterOpen || activeFilterCount > 0
                ? 'border-emerald-700 bg-emerald-800 text-white hover:bg-emerald-900'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>{t.gisPage.filterBtn}</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleResetToOverview}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>{t.gisPage.resetViewBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => currentBbox && loadParcels(currentBbox, currentZoom, activeFilters)}
            title="Refresh Viewport Data"
            disabled={loading}
            className="inline-flex items-center justify-center h-8.5 w-8.5 rounded-xl border border-slate-300 bg-white text-slate-600 shadow-xs hover:bg-slate-50 hover:text-emerald-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── 4 Sovereign Cadastral Spatial Metric Chips ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Metric 1 */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.gisPage.metricLoadedParcels}</span>
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 border border-emerald-100">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900">{features.length}</span>
            {totalCount > features.length && (
              <span className="text-xs font-medium text-slate-500">/ {totalCount} total</span>
            )}
          </div>
          <div className="mt-1 text-[11px] font-medium text-emerald-700 truncate">
            {truncated ? t.gisPage.truncatedWarning : 'All bounding box parcels mapped'}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.gisPage.metricSpatialEngine}</span>
            <div className="rounded-lg bg-blue-50 p-1.5 text-blue-700 border border-blue-100">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-base font-bold text-slate-900">PostGIS 3.5</span>
            <span className="text-xs text-blue-600 font-semibold">(SRID 4326)</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-500 truncate">
            WGS84 Ellipsoidal Spatial Cadastre
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.gisPage.metricZoomStatus}</span>
            <div
              className={`rounded-lg p-1.5 border ${
                currentZoom >= 12
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}
            >
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900">Level {currentZoom}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                currentZoom >= 12 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {currentZoom >= 12 ? 'Cadastre Active' : 'Overview'}
            </span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-500 truncate">
            {currentZoom >= 12 ? 'Polygon boundary resolution active' : t.gisPage.zoomWarning}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.gisPage.metricSurveyStandard}</span>
            <div className="rounded-lg bg-purple-50 p-1.5 text-purple-700 border border-purple-100">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-base font-bold text-slate-900">SOI / DILRMP</span>
            <span className="text-xs text-purple-600 font-bold">100%</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-500 truncate">
            NIC Land Records Cadastral Standard
          </div>
        </div>
      </div>

      {/* ── 5-State Nationwide Cadastral Quick-Jump Bar ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs space-y-2.5">
        {/* Top: State Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
          <span className="font-bold text-slate-700 shrink-0 flex items-center gap-1.5 mr-2 text-[11px] uppercase tracking-wider">
            <Navigation className="h-3.5 w-3.5 text-emerald-600" />
            <span>National Cadastre:</span>
          </span>
          {STATE_FILTER_TABS.map((tab) => {
            const isActive = selectedStateTab === tab.code;
            return (
              <button
                key={tab.code}
                type="button"
                onClick={() => setSelectedStateTab(tab.code)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10.5px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-emerald-950 text-emerald-100' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom: District Quick-Jump Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 uppercase tracking-wider mr-1">
            Jump to District:
          </span>
          {filteredPresets.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold shadow-2xs transition shrink-0 cursor-pointer ${
                  isSelected
                    ? 'border-emerald-700 bg-emerald-700 text-white font-bold shadow-xs ring-2 ring-emerald-600/30'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/60 hover:text-emerald-950'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${isSelected ? 'bg-emerald-200 ring-2 ring-white/50' : 'bg-slate-400'}`}
                />
                <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-500'
                }`}>
                  {preset.stateCode}
                </span>
                <span>{preset.label}</span>
                <span className={`text-[10.5px] font-bold ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                  &bull; {preset.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Map Canvas Container ── */}
      <div className="relative h-[calc(100vh-21rem)] min-h-[580px] w-full rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden bg-slate-900">
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
            targetFlyTo={targetFlyTo}
          />

          {/* Floating Collapsible Filter Panel Floating on Left */}
          {isFilterOpen && (
            <div className="absolute top-4 left-4 z-20 w-80 sm:w-88 max-h-[calc(100%-2rem)] shadow-2xl rounded-2xl">
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
    </div>
  );
}
