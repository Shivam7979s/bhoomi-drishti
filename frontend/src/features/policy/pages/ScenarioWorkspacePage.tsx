import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Edit2,
  Trash2,
  Scale,
  Clock,
  FileText,
  Loader2,
  Calendar,
  User,
  History,
} from 'lucide-react';
import { getScenario, runScenario, deleteScenario, getScenarioResults } from '../services/policyService';
import { ScenarioStatusBadge, ScenarioTypeBadge } from '../components/ScenarioBadge';
import { ScenarioKpiCards } from '../components/ScenarioKpiCards';
import { DistributionChart } from '../components/DistributionChart';
import { ScenarioGisTab } from '../components/ScenarioGisTab';
import { ScenarioEvidenceTab } from '../components/ScenarioEvidenceTab';
import { ScenarioBuilderModal } from '../components/ScenarioBuilderModal';
import type { PolicyScenario, ScenarioResult } from '../types/policy';
import { AppContainer } from '../../../components/layout/AppContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { EmptyState } from '../../../components/layout/EmptyState';
import { ErrorState } from '../../../components/layout/ErrorState';

export function ScenarioWorkspacePage() {
  const { projectId, scenarioId } = useParams<{ projectId: string; scenarioId: string }>();
  const navigate = useNavigate();

  const [scenario, setScenario] = useState<PolicyScenario | null>(null);
  const [resultsHistory, setResultsHistory] = useState<ScenarioResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'parameters' | 'results' | 'gis' | 'evidence'>('overview');

  // Modals & Action trackers
  const [showEditModal, setShowEditModal] = useState(false);
  const [running, setRunning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadScenarioData() {
    if (!scenarioId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getScenario(scenarioId);
      setScenario(data);

      // Load results history
      try {
        const history = await getScenarioResults(scenarioId);
        setResultsHistory(history);
        setSelectedResult(history[0] || data.latestResult || null);
      } catch {
        setSelectedResult(data.latestResult || null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load policy scenario.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadScenarioData();
  }, [scenarioId]);

  async function handleRun() {
    if (!scenario) return;
    setRunning(true);
    try {
      const newResult = await runScenario(scenario.id);
      await loadScenarioData();
      setSelectedResult(newResult);
      setActiveTab('results');
    } catch (err: any) {
      alert(err?.message || 'Simulation execution failed.');
    } finally {
      setRunning(false);
    }
  }

  async function handleDelete() {
    if (!scenario) return;
    if (!window.confirm('Are you sure you want to delete this scenario? This cannot be undone.')) return;

    setDeleting(true);
    try {
      await deleteScenario(scenario.id);
      navigate(`/projects/${projectId}`, { replace: true });
    } catch (err: any) {
      alert(err?.message || 'Failed to delete scenario.');
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <AppContainer>
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-xs font-medium text-slate-500">Loading policy scenario workspace...</p>
        </div>
      </AppContainer>
    );
  }

  if (error || !scenario) {
    return (
      <AppContainer>
        <ErrorState
          title="Scenario Not Found or Inaccessible"
          description={error || 'You do not have permission to view this scenario.'}
          action={
            <Link
              to={projectId ? `/projects/${projectId}` : '/workspaces'}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Project
            </Link>
          }
        />
      </AppContainer>
    );
  }

  const isDraft = scenario.status === 'DRAFT';
  const isRunning = scenario.status === 'RUNNING' || running;
  const isArchived = scenario.status === 'ARCHIVED';
  const hasResults = !!selectedResult || !!scenario.latestResult;
  const p = scenario.parameters || {};

  return (
    <AppContainer>
      {/* Institutional Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Workspaces', to: '/workspaces' },
          { label: 'Project', to: `/projects/${projectId}` },
          { label: 'Policy Scenarios' },
          { label: scenario.name },
        ]}
        badge={{
          text: `Policy Simulation · ${scenario.scenarioType}`,
          icon: Scale,
          variant: 'indigo',
        }}
        title={scenario.name}
        description={scenario.description || 'Deterministic PostGIS land policy simulation and counterfactual modeling.'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ScenarioStatusBadge status={scenario.status} />
            <ScenarioTypeBadge type={scenario.scenarioType} />

            {!isArchived && (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                disabled={isRunning}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Parameters</span>
              </button>
            )}

            <Link
              to={`/projects/${projectId}/scenarios/compare?scenarioIds=${scenario.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-800 shadow-2xs hover:bg-indigo-100 transition"
            >
              <Scale className="h-3.5 w-3.5 text-indigo-600" />
              <span>Compare</span>
            </Link>

            {isDraft && !hasResults && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-2xs hover:bg-rose-50 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            )}

            {!isArchived && (
              <button
                type="button"
                onClick={handleRun}
                disabled={isRunning}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-800 disabled:opacity-50 transition"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Executing Simulation...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span>{hasResults ? 'Re-run Simulation' : 'Run Simulation'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span>Author:</span>
            <strong className="text-slate-700 font-semibold">{scenario.createdByName || 'Researcher'}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Updated:</span>
            <span className="text-slate-700 font-medium">
              {new Date(scenario.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </span>
          {scenario.evidenceCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800 border border-teal-200/70">
              <FileText className="h-3.5 w-3.5 text-teal-600" />
              <span>{scenario.evidenceCount} evidence citations</span>
            </span>
          )}
        </div>
      </PageHeader>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200/80 text-xs sm:text-sm font-semibold gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`border-b-2 px-5 py-3 transition ${
            activeTab === 'overview'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('parameters')}
          className={`border-b-2 px-5 py-3 transition ${
            activeTab === 'parameters'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          Parameters
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('results')}
          className={`border-b-2 px-5 py-3 transition ${
            activeTab === 'results'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          Simulation Results {resultsHistory.length > 0 && `(${resultsHistory.length})`}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gis')}
          className={`border-b-2 px-5 py-3 transition ${
            activeTab === 'gis'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          GIS Spatial View
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evidence')}
          className={`border-b-2 px-5 py-3 transition ${
            activeTab === 'evidence'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          Evidence &amp; Provenance {scenario.evidenceCount > 0 && `(${scenario.evidenceCount})`}
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          {hasResults && selectedResult ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Latest Execution Impact KPIs</h3>
              <ScenarioKpiCards result={selectedResult} compact={true} />
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="Scenario Simulation Pending"
              description="Execute the deterministic PostGIS simulation engine to compute parcel-level impact metrics and spatial distributions."
              action={
                !isArchived ? (
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={isRunning}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-emerald-800 transition"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Run Simulation Now</span>
                  </button>
                ) : undefined
              }
            />
          )}

          {/* Parameter Summary Grid */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Configuration Highlights</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target State</span>
                <span className="font-semibold text-slate-800">{p.targetState || 'All / Not restricted'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target District</span>
                <span className="font-semibold text-slate-800">{p.targetDistrict || 'All / Not restricted'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tehsil / Village</span>
                <span className="font-semibold text-slate-800">
                  {[p.targetTehsil, p.targetVillage].filter(Boolean).join(', ') || 'District-wide'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Scenario Type</span>
                <span className="font-semibold text-slate-800">{scenario.scenarioType}</span>
              </div>
            </div>
          </div>

          {/* Historical Run Log */}
          {resultsHistory.length > 0 && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Persisted Snapshot History</h3>
              <div className="overflow-hidden rounded-xl border border-slate-200/80 text-xs">
                <table className="w-full text-left text-slate-700">
                  <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Snapshot Time</th>
                      <th className="px-4 py-3">Evaluated</th>
                      <th className="px-4 py-3">Affected</th>
                      <th className="px-4 py-3">Area Affected</th>
                      <th className="px-4 py-3">Disputed Exposure</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resultsHistory.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {new Date(r.executedAt).toLocaleString('en-IN')}
                          {idx === 0 && <span className="ml-2 rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] text-teal-800 font-bold border border-teal-200/70">Latest</span>}
                        </td>
                        <td className="px-4 py-3">{r.totalParcelsEvaluated.toLocaleString()}</td>
                        <td className="px-4 py-3 font-bold text-blue-700">{r.totalParcelsAffected.toLocaleString()}</td>
                        <td className="px-4 py-3 font-bold text-emerald-800">{(r.totalAreaAffectedSqm / 10000).toFixed(2)} ha</td>
                        <td className="px-4 py-3 text-rose-700">{r.disputedParcelsCount} parcels</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedResult(r);
                              setActiveTab('results');
                            }}
                            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline transition"
                          >
                            View Metrics
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PARAMETERS */}
      {activeTab === 'parameters' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Configured Parameters</h3>
              <p className="text-xs text-slate-500">
                Detailed boundary configuration and spatial intervention settings.
              </p>
            </div>
            {!isArchived && (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-800 transition"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Parameters</span>
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-6 text-xs">
            {/* Geographic Targeting */}
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
                Geographic Scope
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-slate-50/80 p-4 border border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">State</span>
                  <span className="font-semibold text-slate-800">{p.targetState || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">District</span>
                  <span className="font-semibold text-slate-800">{p.targetDistrict || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tehsil</span>
                  <span className="font-semibold text-slate-800">{p.targetTehsil || 'All'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Village</span>
                  <span className="font-semibold text-slate-800">{p.targetVillage || 'All'}</span>
                </div>
              </div>
            </div>

            {/* Transformation Rules */}
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
                Simulation Transformation Rules
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-slate-50/80 p-4 border border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Source Land Use</span>
                  <span className="font-semibold text-slate-800">{p.sourceLandUse || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target Land Use</span>
                  <span className="font-semibold text-slate-800">{p.targetLandUse || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Conversion Percentage</span>
                  <span className="font-semibold text-blue-700">
                    {p.conversionPercentage !== null && p.conversionPercentage !== undefined ? `${p.conversionPercentage}%` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Max Ownership Area</span>
                  <span className="font-semibold text-purple-700">
                    {p.maxOwnershipArea ? `${Number(p.maxOwnershipArea).toLocaleString()} m²` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Spatial Geometry WKT */}
            {p.interventionGeometryWkt && (
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                  Intervention Geometry (SRID 4326)
                </h4>
                <div className="rounded-xl bg-slate-900 text-slate-200 p-4 font-mono text-[11px] overflow-x-auto shadow-inner">
                  {p.interventionGeometryWkt}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SIMULATION RESULTS */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Snapshot selector if multiple runs exist */}
          {resultsHistory.length > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-2">
                <History className="h-4 w-4 text-emerald-600" />
                <span>Showing Result Snapshot:</span>
              </span>
              <select
                value={selectedResult?.id || ''}
                onChange={(e) => {
                  const found = resultsHistory.find((r) => r.id === e.target.value);
                  if (found) setSelectedResult(found);
                }}
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-emerald-600 focus:outline-none"
              >
                {resultsHistory.map((r, i) => (
                  <option key={r.id} value={r.id}>
                    {new Date(r.executedAt).toLocaleString('en-IN')} {i === 0 ? '(Latest)' : `(Run #${resultsHistory.length - i})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedResult ? (
            <>
              {/* Primary KPI Cards */}
              <ScenarioKpiCards result={selectedResult} />

              {/* Categorical Distribution Visualizations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DistributionChart
                  title="Simulated Land-Use Distribution"
                  subtitle="Categorical land-use profile computed by deterministic simulation"
                  dataJson={selectedResult.landUseDistributionJson}
                />
                <DistributionChart
                  title="Ownership Distribution"
                  subtitle="Categorical holding type profile across evaluated parcels"
                  dataJson={selectedResult.ownershipDistributionJson}
                />
              </div>

              {/* Spatial Summary Box */}
              {selectedResult.spatialSummaryJson && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-2">
                  <h4 className="text-sm font-bold text-slate-900">Spatial Extents &amp; Summary</h4>
                  <pre className="rounded-xl bg-slate-50/80 p-3.5 text-[11px] font-mono text-slate-700 overflow-x-auto border border-slate-100">
                    {JSON.stringify(JSON.parse(selectedResult.spatialSummaryJson), null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={Clock}
              title="No Simulation Results Available"
              description="Execute the scenario simulation to calculate impact metrics, distributions, and spatial extents."
              action={
                !isArchived ? (
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={isRunning}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-emerald-800 transition"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Execute Simulation</span>
                  </button>
                ) : undefined
              }
            />
          )}
        </div>
      )}

      {/* 4. GIS SPATIAL VIEW */}
      {activeTab === 'gis' && (
        <ScenarioGisTab scenario={scenario} />
      )}

      {/* 5. EVIDENCE & PROVENANCE */}
      {activeTab === 'evidence' && (
        <ScenarioEvidenceTab
          scenario={scenario}
          canEdit={!isArchived}
        />
      )}

      {/* Scenario Builder Modal */}
      <ScenarioBuilderModal
        projectId={projectId || ''}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onScenarioSaved={() => {
          loadScenarioData();
        }}
        scenarioToEdit={scenario}
      />
    </AppContainer>
  );
}
