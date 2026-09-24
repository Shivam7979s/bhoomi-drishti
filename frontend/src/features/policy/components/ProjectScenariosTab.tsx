import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  Plus,
  Play,
  ArrowRight,
  Trash2,
  Edit2,
  Scale,
  AlertCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import { listProjectScenarios, runScenario, deleteScenario } from '../services/policyService';
import { ScenarioStatusBadge, ScenarioTypeBadge } from './ScenarioBadge';
import { ScenarioBuilderModal } from './ScenarioBuilderModal';
import type { PolicyScenario } from '../types/policy';

interface ProjectScenariosTabProps {
  projectId: string;
  canContribute: boolean;
}

export function ProjectScenariosTab({ projectId, canContribute }: ProjectScenariosTabProps) {
  const navigate = useNavigate();

  const [scenarios, setScenarios] = useState<PolicyScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Edit states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scenarioToEdit, setScenarioToEdit] = useState<PolicyScenario | null>(null);

  // Running & deleting trackers
  const [runningId, setRunningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Multi-selection for comparison
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);

  async function loadScenarios() {
    setLoading(true);
    setError(null);
    try {
      const res = await listProjectScenarios(projectId, 0, 50);
      setScenarios(res.content || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load policy scenarios.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadScenarios();
  }, [projectId]);

  async function handleRun(scenarioId: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    setRunningId(scenarioId);
    try {
      await runScenario(scenarioId);
      await loadScenarios();
    } catch (err: any) {
      alert(err?.message || 'Failed to execute scenario simulation.');
    } finally {
      setRunningId(null);
    }
  }

  async function handleDelete(scenarioId: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    if (!window.confirm('Delete this scenario? Only DRAFT scenarios without results can be deleted.')) return;

    setDeletingId(scenarioId);
    try {
      await deleteScenario(scenarioId);
      setScenarios((prev) => prev.filter((s) => s.id !== scenarioId));
      setSelectedScenarioIds((prev) => prev.filter((id) => id !== scenarioId));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete scenario.');
    } finally {
      setDeletingId(null);
    }
  }

  function toggleSelectScenario(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedScenarioIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleGoToCompare() {
    if (selectedScenarioIds.length < 2) {
      alert('Please select at least 2 scenarios to compare.');
      return;
    }
    const query = selectedScenarioIds.map((id) => `scenarioIds=${id}`).join('&');
    navigate(`/projects/${projectId}/scenarios/compare?${query}`);
  }

  return (
    <div className="space-y-4">
      {/* Tab Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Policy Scenarios &amp; Spatial Simulations ({scenarios.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Model statutory interventions, land ceiling redistribution, and re-zoning with PostGIS spatial analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedScenarioIds.length >= 2 && (
            <button
              type="button"
              onClick={handleGoToCompare}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Scale className="h-3.5 w-3.5" />
              Compare Selected ({selectedScenarioIds.length})
            </button>
          )}

          {canContribute && (
            <button
              type="button"
              onClick={() => {
                setScenarioToEdit(null);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              <Plus className="h-4 w-4" />
              New Scenario
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Scenarios List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : scenarios.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Layers className="mx-auto h-10 w-10 text-slate-400" />
          <h4 className="mt-3 text-sm font-semibold text-slate-800">No Scenarios Created</h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Create a policy scenario to simulate rezoning, calculate corridor buffer exposure, or assess land ceiling impacts.
          </p>
          {canContribute && (
            <button
              type="button"
              onClick={() => {
                setScenarioToEdit(null);
                setShowCreateModal(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Create First Scenario
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {scenarios.map((scenario) => {
            const isSelected = selectedScenarioIds.includes(scenario.id);
            const isRunning = runningId === scenario.id || scenario.status === 'RUNNING';
            const isDeleting = deletingId === scenario.id;
            const hasResult = !!scenario.latestResult;
            const isDraft = scenario.status === 'DRAFT';
            const isArchived = scenario.status === 'ARCHIVED';

            return (
              <div
                key={scenario.id}
                className={`relative flex flex-col justify-between rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                  isSelected ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Checkbox for compare */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectScenario(scenario.id, e as any)}
                        title="Select for comparison"
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <ScenarioTypeBadge type={scenario.scenarioType} size="sm" />
                          <ScenarioStatusBadge status={scenario.status} size="sm" />
                          {scenario.evidenceCount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-800 border border-teal-200">
                              <FileText className="h-3 w-3" />
                              {scenario.evidenceCount} evidence
                            </span>
                          )}
                        </div>

                        <Link
                          to={`/projects/${projectId}/scenarios/${scenario.id}`}
                          className="mt-1 block text-base font-bold text-slate-900 hover:text-emerald-700 transition"
                        >
                          {scenario.name}
                        </Link>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-1.5">
                      {canContribute && !isArchived && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setScenarioToEdit(scenario);
                            setShowCreateModal(true);
                          }}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                          title="Edit Parameters"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}

                      {canContribute && isDraft && !hasResult && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(scenario.id, e)}
                          disabled={isDeleting}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Delete Scenario"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}

                      {canContribute && !isArchived && (
                        <button
                          type="button"
                          onClick={(e) => handleRun(scenario.id, e)}
                          disabled={isRunning}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition"
                        >
                          {isRunning ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                              Simulating...
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 text-emerald-600" />
                              {hasResult ? 'Re-run' : 'Run'}
                            </>
                          )}
                        </button>
                      )}

                      <Link
                        to={`/projects/${projectId}/scenarios/${scenario.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                      >
                        Open
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  {scenario.description && (
                    <p className="mt-2 text-xs text-slate-600 line-clamp-2 pl-7">
                      {scenario.description}
                    </p>
                  )}
                </div>

                {/* Latest Result KPI Strip */}
                {hasResult && scenario.latestResult ? (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg bg-slate-50 p-2.5 border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Evaluated</span>
                      <span className="font-bold text-slate-800">
                        {scenario.latestResult.totalParcelsEvaluated.toLocaleString()} parcels
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Affected</span>
                      <span className="font-bold text-blue-700">
                        {scenario.latestResult.totalParcelsAffected.toLocaleString()} parcels
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Area Affected</span>
                      <span className="font-bold text-emerald-700">
                        {(scenario.latestResult.totalAreaAffectedSqm / 10000).toFixed(2)} ha
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Disputed</span>
                      <span className="font-bold text-rose-700">
                        {scenario.latestResult.disputedParcelsCount} parcels
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-slate-400 italic pl-7">
                    Not yet executed. Click &quot;Run&quot; to perform deterministic spatial simulation.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Scenario Builder Modal */}
      <ScenarioBuilderModal
        projectId={projectId}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onScenarioSaved={() => {
          loadScenarios();
        }}
        scenarioToEdit={scenarioToEdit}
      />
    </div>
  );
}
