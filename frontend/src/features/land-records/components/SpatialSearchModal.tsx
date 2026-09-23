import { useState } from 'react';
import { AlertCircle, Compass, Loader2, Sparkles, X } from 'lucide-react';
import { searchSpatialContains, searchSpatialIntersects } from '../services/landRecordService';
import type { GeoJsonGeometry, LandRecord, LandRecordStatus, PageResponse } from '../types/landRecord';

interface SpatialSearchModalProps {
  onClose: () => void;
  onResultsFound: (response: PageResponse<LandRecord>, queryType: string) => void;
}

const PRESET_BHOPAL_SEARCH: GeoJsonGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [77.4000, 23.2400],
      [77.4300, 23.2400],
      [77.4300, 23.2700],
      [77.4000, 23.2700],
      [77.4000, 23.2400],
    ],
  ],
};

const PRESET_INDORE_SEARCH: GeoJsonGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [75.8400, 22.7000],
      [75.8700, 22.7000],
      [75.8700, 22.7300],
      [75.8400, 22.7300],
      [75.8400, 22.7000],
    ],
  ],
};

export function SpatialSearchModal({ onClose, onResultsFound }: SpatialSearchModalProps) {
  const [operation, setOperation] = useState<'intersects' | 'contains'>('intersects');
  const [status, setStatus] = useState<string>('');
  const [queryJson, setQueryJson] = useState(JSON.stringify(PRESET_BHOPAL_SEARCH, null, 2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let parsedGeom: GeoJsonGeometry;
    try {
      parsedGeom = JSON.parse(queryJson);
      if (parsedGeom.type !== 'Polygon' && parsedGeom.type !== 'MultiPolygon') {
        throw new Error('Query geometry must be a GeoJSON Polygon or MultiPolygon');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid GeoJSON syntax';
      setError(`Geometry error: ${msg}`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        geometry: parsedGeom,
        status: status ? (status as LandRecordStatus) : undefined,
      };

      const result = operation === 'intersects'
        ? await searchSpatialIntersects(payload)
        : await searchSpatialContains(payload);

      onResultsFound(result, operation === 'intersects' ? 'ST_Intersects' : 'ST_Contains');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Spatial query execution failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <Compass className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">PostGIS Spatial Query</h2>
              <p className="text-xs text-slate-500">Query land records using PostGIS spatial indexing (SRID 4326).</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleExecute} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-sm">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Operation Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">Spatial Operation</label>
              <div className="mt-1.5 grid grid-cols-2 gap-3">
                <label
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 text-xs font-medium transition ${
                    operation === 'intersects'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="operation"
                    value="intersects"
                    checked={operation === 'intersects'}
                    onChange={() => setOperation('intersects')}
                    className="sr-only"
                  />
                  <span>ST_Intersects (Overlaps)</span>
                </label>
                <label
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 text-xs font-medium transition ${
                    operation === 'contains'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="operation"
                    value="contains"
                    checked={operation === 'contains'}
                    onChange={() => setOperation('contains')}
                    className="sr-only"
                  />
                  <span>ST_Contains (Encompasses)</span>
                </label>
              </div>
            </div>

            {/* Optional Status filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">Status Restriction (Optional)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Statuses (Role Permitted)</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                <option value="DISPUTED">DISPUTED</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            {/* GeoJSON Query Polygon */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Query Geometry (GeoJSON SRID 4326)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQueryJson(JSON.stringify(PRESET_BHOPAL_SEARCH, null, 2))}
                    className="flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 hover:bg-indigo-100"
                  >
                    <Sparkles className="h-3 w-3" /> Bhopal Region
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueryJson(JSON.stringify(PRESET_INDORE_SEARCH, null, 2))}
                    className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-200"
                  >
                    <Sparkles className="h-3 w-3" /> Indore Region
                  </button>
                </div>
              </div>
              <textarea
                rows={6}
                required
                value={queryJson}
                onChange={(e) => setQueryJson(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-slate-900 p-3 font-mono text-xs text-indigo-300 shadow-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Run Spatial Query
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
