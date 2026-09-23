import { useState } from 'react';
import { AlertCircle, Loader2, Sparkles, X } from 'lucide-react';
import type {
  CreateLandRecordRequest,
  GeoJsonGeometry,
  LandRecord,
  LandRecordStatus,
  LandUseType,
  OwnershipType,
  UpdateLandRecordRequest,
} from '../types/landRecord';

interface LandRecordFormModalProps {
  initialRecord?: LandRecord | null;
  onClose: () => void;
  onSubmit: (data: CreateLandRecordRequest | UpdateLandRecordRequest) => Promise<void>;
}

const PRESET_BHOPAL_POLYGON: GeoJsonGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [77.4100, 23.2500],
      [77.4200, 23.2500],
      [77.4200, 23.2600],
      [77.4100, 23.2600],
      [77.4100, 23.2500],
    ],
  ],
};

const PRESET_INDORE_POLYGON: GeoJsonGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [75.8500, 22.7100],
      [75.8600, 22.7100],
      [75.8600, 22.7200],
      [75.8500, 22.7200],
      [75.8500, 22.7100],
    ],
  ],
};

export function LandRecordFormModal({ initialRecord, onClose, onSubmit }: LandRecordFormModalProps) {
  const isEditing = Boolean(initialRecord);

  const [parcelNumber, setParcelNumber] = useState(initialRecord?.parcelNumber ?? '');
  const [surveyNumber, setSurveyNumber] = useState(initialRecord?.surveyNumber ?? '');
  const [state, setState] = useState(initialRecord?.state ?? 'Madhya Pradesh');
  const [district, setDistrict] = useState(initialRecord?.district ?? 'Bhopal');
  const [tehsil, setTehsil] = useState(initialRecord?.tehsil ?? 'Huzur');
  const [village, setVillage] = useState(initialRecord?.village ?? 'Kolar');
  const [landAreaSqMeters, setLandAreaSqMeters] = useState(initialRecord?.landAreaSqMeters?.toString() ?? '5000');
  const [landUseType, setLandUseType] = useState<LandUseType>(initialRecord?.landUseType ?? 'AGRICULTURAL');
  const [ownershipType, setOwnershipType] = useState<OwnershipType>(initialRecord?.ownershipType ?? 'INDIVIDUAL');
  const [ownerName, setOwnerName] = useState(initialRecord?.ownerName ?? '');
  const [ownerIdentifier, setOwnerIdentifier] = useState(initialRecord?.ownerIdentifier ?? '');
  const [status, setStatus] = useState<LandRecordStatus>(initialRecord?.status ?? 'ACTIVE');
  const [boundaryJson, setBoundaryJson] = useState(
    initialRecord ? JSON.stringify(initialRecord.boundary, null, 2) : JSON.stringify(PRESET_BHOPAL_POLYGON, null, 2)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let parsedBoundary: GeoJsonGeometry;
    try {
      parsedBoundary = JSON.parse(boundaryJson);
      if (parsedBoundary.type !== 'Polygon' && parsedBoundary.type !== 'MultiPolygon') {
        throw new Error('Boundary must be a GeoJSON Polygon or MultiPolygon');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid GeoJSON syntax';
      setError(`Boundary error: ${msg}`);
      return;
    }

    const areaNum = Number(landAreaSqMeters);
    if (isNaN(areaNum) || areaNum <= 0) {
      setError('Land area must be a positive number');
      return;
    }

    const payload: CreateLandRecordRequest = {
      parcelNumber: parcelNumber.trim(),
      surveyNumber: surveyNumber.trim() || undefined,
      state: state.trim(),
      district: district.trim(),
      tehsil: tehsil.trim(),
      village: village.trim(),
      landAreaSqMeters: areaNum,
      landUseType,
      ownershipType,
      ownerName: ownerName.trim(),
      ownerIdentifier: ownerIdentifier.trim() || undefined,
      status,
      boundary: parsedBoundary,
    };

    setLoading(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save land record';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? `Edit Land Record: ${initialRecord?.parcelNumber}` : 'Create New Land Record'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditing ? 'Update parcel attributes and boundary geometry.' : 'Register a new parcel into the PostGIS database.'}
            </p>
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
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-sm">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Parcel & Survey */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Parcel Number *</label>
                <input
                  type="text"
                  required
                  value={parcelNumber}
                  onChange={(e) => setParcelNumber(e.target.value)}
                  placeholder="e.g. MP-BHO-2026-001"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Survey Number</label>
                <input
                  type="text"
                  value={surveyNumber}
                  onChange={(e) => setSurveyNumber(e.target.value)}
                  placeholder="e.g. SN-45/1"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Location Hierarchy */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">State *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">District *</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Tehsil *</label>
                <input
                  type="text"
                  required
                  value={tehsil}
                  onChange={(e) => setTehsil(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Village *</label>
                <input
                  type="text"
                  required
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Area, Land Use, Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Land Area (m²) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={landAreaSqMeters}
                  onChange={(e) => setLandAreaSqMeters(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Land Use Type *</label>
                <select
                  value={landUseType}
                  onChange={(e) => setLandUseType(e.target.value as LandUseType)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="AGRICULTURAL">AGRICULTURAL</option>
                  <option value="RESIDENTIAL">RESIDENTIAL</option>
                  <option value="COMMERCIAL">COMMERCIAL</option>
                  <option value="INDUSTRIAL">INDUSTRIAL</option>
                  <option value="GOVERNMENT">GOVERNMENT</option>
                  <option value="FOREST">FOREST</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LandRecordStatus)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                  <option value="DISPUTED">DISPUTED</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            {/* Ownership & Owner Details */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Ownership Type *</label>
                <select
                  value={ownershipType}
                  onChange={(e) => setOwnershipType(e.target.value as OwnershipType)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="INDIVIDUAL">INDIVIDUAL</option>
                  <option value="JOINT">JOINT</option>
                  <option value="GOVERNMENT">GOVERNMENT</option>
                  <option value="COMMUNITY">COMMUNITY</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Owner Name *</label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar Sharma"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Owner Identifier</label>
                <input
                  type="text"
                  value={ownerIdentifier}
                  onChange={(e) => setOwnerIdentifier(e.target.value)}
                  placeholder="e.g. OWN-2026-45 (Prototype only)"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Boundary GeoJSON */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  PostGIS Boundary Geometry (GeoJSON SRID 4326) *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBoundaryJson(JSON.stringify(PRESET_BHOPAL_POLYGON, null, 2));
                      setDistrict('Bhopal');
                      setVillage('Kolar');
                    }}
                    className="flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-100"
                  >
                    <Sparkles className="h-3 w-3" /> Preset: Bhopal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBoundaryJson(JSON.stringify(PRESET_INDORE_POLYGON, null, 2));
                      setDistrict('Indore');
                      setVillage('Rau');
                    }}
                    className="flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-100"
                  >
                    <Sparkles className="h-3 w-3" /> Preset: Indore
                  </button>
                </div>
              </div>
              <textarea
                rows={6}
                required
                value={boundaryJson}
                onChange={(e) => setBoundaryJson(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-slate-900 p-3 font-mono text-xs text-emerald-400 shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Coordinates format: [longitude, latitude]. Must form a closed ring (first and last coordinate identical).
              </p>
            </div>
          </div>

          {/* Actions */}
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
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
