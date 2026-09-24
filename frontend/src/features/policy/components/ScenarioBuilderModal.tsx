import { useState, useEffect } from 'react';
import { X, Layers, AlertCircle, Loader2, Info } from 'lucide-react';
import { createScenario, updateScenario } from '../services/policyService';
import type {
  CreatePolicyScenarioRequest,
  LandUseType,
  OwnershipType,
  PolicyScenario,
  ScenarioParameterRequest,
  ScenarioType,
  UpdatePolicyScenarioRequest,
} from '../types/policy';

interface ScenarioBuilderModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onScenarioSaved: (scenario: PolicyScenario) => void;
  scenarioToEdit?: PolicyScenario | null;
}

const SCENARIO_TYPES: { value: ScenarioType; label: string; desc: string }[] = [
  {
    value: 'LAND_USE_CONVERSION',
    label: 'Land-Use Conversion',
    desc: 'Model re-zoning interventions (e.g. agricultural to residential or industrial)',
  },
  {
    value: 'LAND_CEILING_REDISTRIBUTION',
    label: 'Land Ceiling Redistribution',
    desc: 'Simulate maximum holding thresholds and identify surplus parcels for redistribution',
  },
  {
    value: 'DISPUTE_RISK_ASSESSMENT',
    label: 'Dispute Vulnerability Risk',
    desc: 'Evaluate density of disputed cadastral parcels in a proposed project corridor',
  },
  {
    value: 'CORRIDOR_BUFFER_INTERVENTION',
    label: 'Corridor Buffer Intervention',
    desc: 'Identify parcels intersecting a spatial buffer (e.g. 500m along infrastructure)',
  },
  {
    value: 'PROJECT_PARCEL_EVALUATION',
    label: 'Project Parcel Evaluation',
    desc: 'Simulate policy impact across pre-curated project land records',
  },
];

const LAND_USE_TYPES: LandUseType[] = [
  'AGRICULTURAL',
  'RESIDENTIAL',
  'COMMERCIAL',
  'INDUSTRIAL',
  'GOVERNMENT',
  'FOREST',
  'OTHER',
];

const OWNERSHIP_TYPES: OwnershipType[] = [
  'INDIVIDUAL',
  'JOINT',
  'GOVERNMENT',
  'COMMUNITY',
  'OTHER',
];

export function ScenarioBuilderModal({
  projectId,
  isOpen,
  onClose,
  onScenarioSaved,
  scenarioToEdit,
}: ScenarioBuilderModalProps) {
  const isEditing = !!scenarioToEdit;

  // Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scenarioType, setScenarioType] = useState<ScenarioType>('LAND_USE_CONVERSION');

  // Administrative targeting
  const [targetState, setTargetState] = useState('');
  const [targetDistrict, setTargetDistrict] = useState('');
  const [targetTehsil, setTargetTehsil] = useState('');
  const [targetVillage, setTargetVillage] = useState('');

  // Scenario-specific parameters
  const [sourceLandUse, setSourceLandUse] = useState<LandUseType>('AGRICULTURAL');
  const [targetLandUse, setTargetLandUse] = useState<LandUseType>('RESIDENTIAL');
  const [conversionPercentage, setConversionPercentage] = useState<number>(20);
  const [maxOwnershipArea, setMaxOwnershipArea] = useState<number>(20000);
  const [targetOwnershipType, setTargetOwnershipType] = useState<OwnershipType>('INDIVIDUAL');
  const [bufferDistanceMeters, setBufferDistanceMeters] = useState<number>(500);
  const [interventionGeometryWkt, setInterventionGeometryWkt] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if editing
  useEffect(() => {
    if (scenarioToEdit) {
      setName(scenarioToEdit.name || '');
      setDescription(scenarioToEdit.description || '');
      setScenarioType(scenarioToEdit.scenarioType);

      const p = scenarioToEdit.parameters || {};
      setTargetState(p.targetState || '');
      setTargetDistrict(p.targetDistrict || '');
      setTargetTehsil(p.targetTehsil || '');
      setTargetVillage(p.targetVillage || '');

      setSourceLandUse(p.sourceLandUse || 'AGRICULTURAL');
      setTargetLandUse(p.targetLandUse || 'RESIDENTIAL');
      setConversionPercentage(p.conversionPercentage !== null && p.conversionPercentage !== undefined ? Number(p.conversionPercentage) : 20);
      setMaxOwnershipArea(p.maxOwnershipArea !== null && p.maxOwnershipArea !== undefined ? Number(p.maxOwnershipArea) : 20000);
      setTargetOwnershipType(p.targetOwnershipType || 'INDIVIDUAL');
      setBufferDistanceMeters(p.bufferDistanceMeters !== null && p.bufferDistanceMeters !== undefined ? Number(p.bufferDistanceMeters) : 500);
      setInterventionGeometryWkt(p.interventionGeometryWkt || '');
    } else {
      setName('');
      setDescription('');
      setScenarioType('LAND_USE_CONVERSION');
      setTargetState('Madhya Pradesh');
      setTargetDistrict('Sehore');
      setTargetTehsil('');
      setTargetVillage('');
      setSourceLandUse('AGRICULTURAL');
      setTargetLandUse('RESIDENTIAL');
      setConversionPercentage(20);
      setMaxOwnershipArea(20000);
      setTargetOwnershipType('INDIVIDUAL');
      setBufferDistanceMeters(500);
      setInterventionGeometryWkt('');
    }
    setError(null);
  }, [scenarioToEdit, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Scenario name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    // Build parameters based on type
    const params: ScenarioParameterRequest = {};

    if (targetState.trim()) params.targetState = targetState.trim();
    if (targetDistrict.trim()) params.targetDistrict = targetDistrict.trim();
    if (targetTehsil.trim()) params.targetTehsil = targetTehsil.trim();
    if (targetVillage.trim()) params.targetVillage = targetVillage.trim();

    if (scenarioType === 'LAND_USE_CONVERSION') {
      params.sourceLandUse = sourceLandUse;
      params.targetLandUse = targetLandUse;
      params.conversionPercentage = Number(conversionPercentage);
    } else if (scenarioType === 'LAND_CEILING_REDISTRIBUTION') {
      params.maxOwnershipArea = Number(maxOwnershipArea);
      params.targetOwnershipType = targetOwnershipType;
    } else if (scenarioType === 'CORRIDOR_BUFFER_INTERVENTION') {
      params.bufferDistanceMeters = Number(bufferDistanceMeters);
      if (interventionGeometryWkt.trim()) {
        params.interventionGeometryWkt = interventionGeometryWkt.trim();
      }
    }

    try {
      if (isEditing && scenarioToEdit) {
        const updateReq: UpdatePolicyScenarioRequest = {
          name: name.trim(),
          description: description.trim() || undefined,
          parameters: params,
        };
        const saved = await updateScenario(scenarioToEdit.id, updateReq);
        onScenarioSaved(saved);
      } else {
        const createReq: CreatePolicyScenarioRequest = {
          name: name.trim(),
          description: description.trim() || undefined,
          scenarioType,
          parameters: params,
        };
        const saved = await createScenario(projectId, createReq);
        onScenarioSaved(saved);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save scenario configuration.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] max-h-[850px] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? 'Configure Scenario Parameters' : 'Create Policy Scenario'}
              </h3>
              <p className="text-xs text-slate-500">
                Configure deterministic spatial boundaries and transformation rules
              </p>
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
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-6 space-y-5">
          {/* Lifecycle transition notice if editing a completed scenario */}
          {isEditing && scenarioToEdit?.status === 'COMPLETED' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-950">Lifecycle Rule: </span>
                Modifying parameters on a <span className="font-bold">COMPLETED</span> scenario will transition its status back to <span className="font-bold">DRAFT</span>. All previous simulation results remain permanently preserved.
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Scenario Name & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Scenario Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Agricultural Re-zoning Buffer 2026"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Description / Policy Context
              </label>
              <textarea
                rows={2}
                maxLength={10000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly state the research intent or statutory background of this simulation..."
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Scenario Type Selection (Locked during edit) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Scenario Type <span className="text-rose-500">*</span>
            </label>
            {isEditing ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700">
                {SCENARIO_TYPES.find((t) => t.value === scenarioType)?.label || scenarioType}
                <span className="ml-2 font-normal text-slate-500">(Type is immutable after creation)</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {SCENARIO_TYPES.map((t) => {
                  const isSelected = scenarioType === t.value;
                  return (
                    <div
                      key={t.value}
                      onClick={() => setScenarioType(t.value)}
                      className={`cursor-pointer rounded-xl border p-3 transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="font-bold text-slate-900 text-xs">{t.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{t.desc}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Administrative Targeting */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Administrative Target Scope
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600">State</label>
                <input
                  type="text"
                  value={targetState}
                  onChange={(e) => setTargetState(e.target.value)}
                  placeholder="e.g. Madhya Pradesh"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600">District</label>
                <input
                  type="text"
                  value={targetDistrict}
                  onChange={(e) => setTargetDistrict(e.target.value)}
                  placeholder="e.g. Sehore"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600">Tehsil (Optional)</label>
                <input
                  type="text"
                  value={targetTehsil}
                  onChange={(e) => setTargetTehsil(e.target.value)}
                  placeholder="e.g. Ashta"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600">Village (Optional)</label>
                <input
                  type="text"
                  value={targetVillage}
                  onChange={(e) => setTargetVillage(e.target.value)}
                  placeholder="e.g. Rampur"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Conditional Parameter Inputs */}
          {scenarioType === 'LAND_USE_CONVERSION' && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Land-Use Transformation Rules
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">Source Land Use</label>
                  <select
                    value={sourceLandUse}
                    onChange={(e) => setSourceLandUse(e.target.value as LandUseType)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm"
                  >
                    {LAND_USE_TYPES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">Target Land Use</label>
                  <select
                    value={targetLandUse}
                    onChange={(e) => setTargetLandUse(e.target.value as LandUseType)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm"
                  >
                    {LAND_USE_TYPES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700">
                  <span>Conversion Percentage</span>
                  <span className="font-mono text-blue-700 font-bold">{conversionPercentage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={conversionPercentage}
                  onChange={(e) => setConversionPercentage(Number(e.target.value))}
                  className="mt-2 w-full accent-blue-600"
                />
                <span className="text-[10px] text-slate-500">
                  Determines the proportion of candidate parcels transformed to the target land use.
                </span>
              </div>
            </div>
          )}

          {scenarioType === 'LAND_CEILING_REDISTRIBUTION' && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                Land Ceiling Thresholds
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Max Ownership Area (m²) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={maxOwnershipArea}
                    onChange={(e) => setMaxOwnershipArea(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-sm"
                  />
                  <span className="text-[10px] text-slate-500">
                    &asymp; {(maxOwnershipArea / 10000).toFixed(2)} hectares
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Target Ownership Type
                  </label>
                  <select
                    value={targetOwnershipType}
                    onChange={(e) => setTargetOwnershipType(e.target.value as OwnershipType)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm"
                  >
                    {OWNERSHIP_TYPES.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {scenarioType === 'CORRIDOR_BUFFER_INTERVENTION' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Corridor Buffer Parameters
              </span>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700">
                  Buffer Distance (Meters) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={bufferDistanceMeters}
                  onChange={(e) => setBufferDistanceMeters(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700">
                  Intervention Geometry (WKT / LineString / Polygon)
                </label>
                <textarea
                  rows={2}
                  value={interventionGeometryWkt}
                  onChange={(e) => setInterventionGeometryWkt(e.target.value)}
                  placeholder="LINESTRING(77.40 23.25, 77.45 23.30)"
                  className="mt-1 w-full font-mono text-[11px] rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Configuration...
                </>
              ) : isEditing ? (
                'Save Parameter Changes'
              ) : (
                'Create Scenario'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
