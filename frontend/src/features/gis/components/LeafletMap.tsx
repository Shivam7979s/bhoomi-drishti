import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Loader2, Maximize2, ZoomIn } from 'lucide-react';
import type { GeoJsonFeature } from '../types/gis';
import { getParcelPathStyle } from '../utils/landUseStyles';

/**
 * Base map tile configuration.
 * For SIH and development demos, uses standard OpenStreetMap tiles.
 * Fully configurable via VITE_MAP_TILE_URL and VITE_MAP_TILE_ATTRIBUTION.
 * Public tile services are for development/demo only; vector tiles / self-hosted tile server are the production direction.
 */
const DEFAULT_TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ||
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const TILE_ATTRIBUTION =
  import.meta.env.VITE_MAP_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

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
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const hoveredFeatureIdRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);

  // Initialize Leaflet Map instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      preferCanvas: true,
    });

    L.tileLayer(DEFAULT_TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const emitViewport = () => {
      const zoom = map.getZoom();
      setCurrentZoom(zoom);
      const bounds = map.getBounds();
      const minLon = bounds.getWest();
      const minLat = bounds.getSouth();
      const maxLon = bounds.getEast();
      const maxLat = bounds.getNorth();
      const bbox = `${minLon.toFixed(6)},${minLat.toFixed(6)},${maxLon.toFixed(6)},${maxLat.toFixed(6)}`;
      onViewportChange(bbox, zoom);
    };

    const handleMoveEnd = () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = window.setTimeout(() => {
        emitViewport();
      }, 300);
    };

    map.on('moveend', handleMoveEnd);

    // Initial trigger
    emitViewport();

    mapInstanceRef.current = map;

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update GeoJSON layer when features or selectedFeature change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing GeoJSON layer
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
          return getParcelPathStyle(feature, isSelected, isHovered);
        },
        onEachFeature: (feature: any, layer: L.Layer) => {
          const props = feature.properties || {};
          const areaHa = props.landAreaSqMeters
            ? (props.landAreaSqMeters / 10000).toFixed(2)
            : '0';

          const tooltipHtml = `
            <div style="font-family: sans-serif; font-size: 11px; line-height: 1.4; color: #1e293b;">
              <strong style="color: #0f172a; font-size: 12px;">${props.parcelNumber || 'Parcel'}</strong>
              <div>${props.village || ''} &bull; <span style="font-weight: 600;">${props.landUseType || ''}</span></div>
              <div style="color: #64748b;">${areaHa} Hectares &bull; ${props.ownershipType || ''}</div>
            </div>
          `;

          layer.bindTooltip(tooltipHtml, {
            sticky: true,
            direction: 'top',
            opacity: 0.95,
            className: 'gis-parcel-tooltip',
          });

          layer.on({
            mouseover: (e) => {
              hoveredFeatureIdRef.current = feature.id;
              const target = e.target as L.Path;
              const isSelected = selectedFeature?.id === feature.id;
              target.setStyle(getParcelPathStyle(feature, isSelected, true));
              target.bringToFront();
            },
            mouseout: (e) => {
              hoveredFeatureIdRef.current = null;
              const target = e.target as L.Path;
              const isSelected = selectedFeature?.id === feature.id;
              target.setStyle(getParcelPathStyle(feature, isSelected, false));
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
  }, [features, selectedFeature]);

  // Center on focus feature when requested
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

  const isZoomGuarded = !zoomThresholdMet || currentZoom < MIN_ZOOM_FOR_PARCELS;

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100">
      {/* Map Container */}
      <div ref={mapContainerRef} className="h-full w-full z-0" tabIndex={0} />

      {/* Floating Status & Notifications Banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none">
        {/* Zoom Guard Banner */}
        {isZoomGuarded && (
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50/95 px-4 py-1.5 text-xs font-medium text-amber-900 shadow-md backdrop-blur-xs">
            <ZoomIn className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              Zoom in closer (Level {MIN_ZOOM_FOR_PARCELS}+) to load cadastral parcel boundaries. (Current: {currentZoom})
            </span>
          </div>
        )}

        {/* Truncation Warning Banner */}
        {!isZoomGuarded && truncated && (
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50/95 px-4 py-1.5 text-xs font-medium text-amber-900 shadow-md backdrop-blur-xs">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              Viewport truncated: Showing <strong>{returnedCount}</strong> of{' '}
              <strong>{totalCount}</strong> parcels. Zoom in to inspect local parcels.
            </span>
          </div>
        )}

        {/* Loading Spinner Indicator */}
        {loading && (
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-md backdrop-blur-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
            <span>Fetching spatial layer...</span>
          </div>
        )}
      </div>

      {/* Map Quick Controls Floating */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleResetView}
          title="Fit View to Parcels"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 hover:text-emerald-700 transition"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Feature Count Counter Tag at Bottom Left */}
      <div className="absolute bottom-6 left-4 z-20 pointer-events-none hidden sm:block">
        <div className="rounded-md border border-slate-200 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm backdrop-blur-xs">
          Loaded in Viewport: <strong className="text-slate-900">{features.length}</strong>
          {totalCount > features.length ? ` / ${totalCount}` : ''} parcels
        </div>
      </div>
    </div>
  );
}
