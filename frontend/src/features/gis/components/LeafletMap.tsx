import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Loader2, Maximize2, ZoomIn, Layers } from 'lucide-react';
import type { GeoJsonFeature } from '../types/gis';
import { getParcelPathStyle } from '../utils/landUseStyles';

// ─── MapTiler configuration ───────────────────────────────────────────────────
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';

type LayerType = 'streets' | 'satellite' | 'hybrid' | 'topo';

interface TileLayerConfig {
  url: string;
  attribution: string;
  label: string;
  maxZoom: number;
}

const MAPTILER_ATTRIBUTION =
  '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>';

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

const buildTileLayers = (key: string): Record<LayerType, TileLayerConfig> => ({
  streets: {
    url: key
      ? `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: key ? MAPTILER_ATTRIBUTION : OSM_ATTRIBUTION,
    label: 'Streets',
    maxZoom: 22,
  },
  satellite: {
    url: key
      ? `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${key}`
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: key ? MAPTILER_ATTRIBUTION : OSM_ATTRIBUTION,
    label: 'Satellite',
    maxZoom: 22,
  },
  hybrid: {
    url: key
      ? `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${key}`
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: key ? MAPTILER_ATTRIBUTION : OSM_ATTRIBUTION,
    label: 'Hybrid',
    maxZoom: 22,
  },
  topo: {
    url: key
      ? `https://api.maptiler.com/maps/topo-v2/{z}/{x}/{y}.png?key=${key}`
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: key ? MAPTILER_ATTRIBUTION : OSM_ATTRIBUTION,
    label: 'Topo',
    maxZoom: 22,
  },
});

const TILE_LAYERS = buildTileLayers(MAPTILER_KEY);
const LAYER_ORDER: LayerType[] = ['streets', 'satellite', 'hybrid', 'topo'];

// Default initial center: Central India (Bhopal / Sehore agricultural zone)
const DEFAULT_CENTER: [number, number] = [23.2599, 77.4126];
const DEFAULT_ZOOM = 13;
const MIN_ZOOM_FOR_PARCELS = 12;

interface LeafletMapProps {
  features: GeoJsonFeature[];
  selectedFeature: GeoJsonFeature | null;
  onSelectFeature: (feature: GeoJsonFeature | null) => void;
  onViewportChange: (bbox: string, zoom: number) => void;
  loading: boolean;
  truncated: boolean;
  totalCount: number;
  returnedCount: number;
  zoomThresholdMet: boolean;
  focusFeature?: GeoJsonFeature | null;
  targetFlyTo?: { center: [number, number]; zoom: number; id: string } | null;
}

export function LeafletMap({
  features,
  selectedFeature,
  onSelectFeature,
  onViewportChange,
  loading,
  truncated,
  totalCount,
  returnedCount,
  zoomThresholdMet,
  focusFeature,
  targetFlyTo,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const hoveredFeatureIdRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [activeLayer, setActiveLayer] = useState<LayerType>('streets');
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);

  // ── Initialize Leaflet Map instance ────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      preferCanvas: false,
      attributionControl: true,
    });

    // Zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer
    const cfg = TILE_LAYERS['streets'];
    const tileLayer = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
    });
    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    const emitViewport = () => {
      const zoom = map.getZoom();
      setCurrentZoom(zoom);
      const bounds = map.getBounds();
      const bbox = `${bounds.getWest().toFixed(6)},${bounds.getSouth().toFixed(6)},${bounds.getEast().toFixed(6)},${bounds.getNorth().toFixed(6)}`;
      onViewportChange(bbox, zoom);
    };

    const handleMoveEnd = () => {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = window.setTimeout(emitViewport, 300);
    };

    map.on('moveend', handleMoveEnd);
    emitViewport();
    mapInstanceRef.current = map;

    return () => {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Switch tile layer when activeLayer changes ──────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = TILE_LAYERS[activeLayer];
    const newTileLayer = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
    });
    newTileLayer.addTo(map);
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.bringToFront();
    }
    tileLayerRef.current = newTileLayer;
  }, [activeLayer]);

  // ── Update GeoJSON layer when features or selectedFeature change ────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }

    if (!features || features.length === 0) return;

    const geoJsonLayer = L.geoJSON(
      {
        type: 'FeatureCollection',
        features: features as any,
      } as any,
      {
        style: (feature: any) => {
          const isSelected = selectedFeature?.id === feature?.id;
          const isHovered = hoveredFeatureIdRef.current === feature?.id;
          return getParcelPathStyle(feature, isHovered, isSelected);
        },
        onEachFeature: (feature: any, layer: L.Layer) => {
          const props = feature.properties || {};
          const areaHa = props.landAreaSqMeters
            ? (props.landAreaSqMeters / 10000).toFixed(2)
            : '0';

          const luColor: Record<string, string> = {
            AGRICULTURAL: '#16a34a',
            RESIDENTIAL: '#2563eb',
            COMMERCIAL: '#d97706',
            INDUSTRIAL: '#7c3aed',
            GOVERNMENT: '#0891b2',
            FOREST: '#15803d',
            OTHER: '#64748b',
          };
          const color = luColor[props.landUseType] || '#64748b';

          const tooltipHtml = `
            <div style="font-family:system-ui,sans-serif;font-size:11px;line-height:1.5;color:#1e293b;min-width:165px;max-width:220px;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${color};flex-shrink:0;"></span>
                <strong style="color:#0f172a;font-size:12.5px;letter-spacing:-0.01em;">${props.parcelNumber || 'Parcel'}</strong>
              </div>
              <div style="color:#334155;font-size:11px;">${props.village || ''}${props.tehsil ? ' · ' + props.tehsil : ''}</div>
              <div style="color:#94a3b8;font-size:10.5px;margin-top:1px;">${props.district || ''}${props.state ? ', ' + props.state : ''}</div>
              <div style="margin-top:5px;padding-top:5px;border-top:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;">
                <span style="color:${color};font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.03em;">${props.landUseType || ''}</span>
                <span style="color:#64748b;font-size:10.5px;font-weight:600;">${areaHa} ha</span>
              </div>
            </div>
          `;

          layer.bindTooltip(tooltipHtml, {
            sticky: true,
            direction: 'top',
            opacity: 0.98,
            className: 'gis-parcel-tooltip',
          });

          layer.on({
            mouseover: (e) => {
              hoveredFeatureIdRef.current = feature.id;
              const target = e.target as L.Path;
              const isSelected = selectedFeature?.id === feature.id;
              target.setStyle(getParcelPathStyle(feature, true, isSelected));
              target.bringToFront();
            },
            mouseout: (e) => {
              hoveredFeatureIdRef.current = null;
              const target = e.target as L.Path;
              const isSelected = selectedFeature?.id === feature.id;
              target.setStyle(getParcelPathStyle(feature, false, isSelected));
            },
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              onSelectFeature(feature);
            },
          });
        },
      },
    );

    geoJsonLayer.addTo(map);
    geoJsonLayerRef.current = geoJsonLayer;
  }, [features, selectedFeature]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Focus on a specific feature ─────────────────────────────────────────────
  useEffect(() => {
    if (!focusFeature || !mapInstanceRef.current) return;
    try {
      const tempLayer = L.geoJSON(focusFeature as any);
      const bounds = tempLayer.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [80, 80],
          maxZoom: 17,
          animate: true,
        });
      }
    } catch (err) {
      console.error('Failed to focus on parcel bounds:', err);
    }
  }, [focusFeature]);

  // ── Fly to coordinate preset ────────────────────────────────────────────────
  useEffect(() => {
    if (!targetFlyTo || !mapInstanceRef.current) return;
    try {
      mapInstanceRef.current.flyTo(targetFlyTo.center, targetFlyTo.zoom, { duration: 1.2 });
    } catch (err) {
      console.error('Failed to fly to target:', err);
    }
  }, [targetFlyTo]);

  const handleResetView = useCallback(() => {
    if (!mapInstanceRef.current) return;
    if (geoJsonLayerRef.current && geoJsonLayerRef.current.getLayers().length > 0) {
      const bounds = geoJsonLayerRef.current.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        return;
      }
    }
    mapInstanceRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  }, []);

  const handleLayerSwitch = useCallback((layer: LayerType) => {
    setActiveLayer(layer);
    setLayerMenuOpen(false);
  }, []);

  const isZoomGuarded = !zoomThresholdMet || currentZoom < MIN_ZOOM_FOR_PARCELS;

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-900">
      {/* Map Container */}
      <div ref={mapContainerRef} className="h-full w-full z-0" tabIndex={0} />

      {/* ── Top-centre status banners ── */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none">
        {isZoomGuarded && (
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50/95 px-4 py-1.5 text-xs font-medium text-amber-900 shadow-md backdrop-blur-sm">
            <ZoomIn className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              Zoom in to level {MIN_ZOOM_FOR_PARCELS}+ to load cadastral parcels (Current: {currentZoom})
            </span>
          </div>
        )}

        {!isZoomGuarded && truncated && (
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50/95 px-4 py-1.5 text-xs font-medium text-amber-900 shadow-md backdrop-blur-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              Viewport showing <strong>{returnedCount}</strong> of{' '}
              <strong>{totalCount}</strong> parcels — zoom in to refine
            </span>
          </div>
        )}

        {loading && (
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md backdrop-blur-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
            <span>Fetching spatial layer…</span>
          </div>
        )}
      </div>

      {/* ── Top-right controls: Reset + Layer Switcher ── */}
      <div
        className="absolute top-3 right-3 z-[1001] flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        {/* Reset / Fit View */}
        <button
          type="button"
          onClick={handleResetView}
          title="Fit view to parcels"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition cursor-pointer"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {/* Layer Switcher Toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLayerMenuOpen((o) => !o)}
            title="Switch map layer"
            className={`flex h-9 w-9 items-center justify-center rounded-lg border shadow-md transition cursor-pointer ${
              layerMenuOpen
                ? 'bg-emerald-700 border-emerald-700 text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'
            }`}
          >
            <Layers className="h-4 w-4" />
          </button>

          {layerMenuOpen && (
            <div className="absolute right-0 top-10 w-36 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden z-[1002] animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Base Layer
              </div>
              {LAYER_ORDER.map((layer) => (
                <button
                  key={layer}
                  type="button"
                  onClick={() => handleLayerSwitch(layer)}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                    activeLayer === layer
                      ? 'bg-emerald-50 text-emerald-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{TILE_LAYERS[layer].label}</span>
                  {activeLayer === layer && (
                    <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom-left parcel counter ── */}
      <div className="absolute bottom-8 left-3 z-20 pointer-events-none">
        <div className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm backdrop-blur-sm">
          {features.length > 0 ? (
            <>
              <strong className="text-slate-900">{features.length}</strong>
              {totalCount > features.length ? (
                <span> / {totalCount.toLocaleString()} parcels in viewport</span>
              ) : (
                <span> parcels loaded</span>
              )}
            </>
          ) : (
            <span className="text-slate-400">No parcels in viewport</span>
          )}
        </div>
      </div>
    </div>
  );
}


