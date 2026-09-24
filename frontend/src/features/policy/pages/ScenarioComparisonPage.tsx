import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Info,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { compareScenarios, listProjectScenarios } from '../services/policyService';
import { ScenarioTypeBadge } from '../components/ScenarioBadge';
import type {
  PolicyScenario,
  ScenarioComparisonResponse,
} from '../types/policy';

export function ScenarioComparisonPage() {
  const { projectId } = useParams<{ projectId?: string }>();
  const [searchParams] = useSearchParams();

  // Target scenario IDs
  const initialIds = searchParams.getAll('scenarioIds');
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);

  // Available scenarios in project for adding
  const [availableScenarios, setAvailableScenarios] = useState<PolicyScenario[]>([]);

  // Comparison data state
  const [comparisonResponse, setComparisonResponse] = useState<ScenarioComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected pairwise pair for detailed delta view
  const [activePairIndex, setActivePairIndex] = useState<number>(0);

  // Load project scenarios if inside a project
  useEffect(() => {
    if (projectId) {
      listProjectScenarios(projectId, 0, 50)
        .then((res) => {
          setAvailableScenarios(res.content || []);
          if (selectedIds.length === 0 && res.content?.length >= 2) {
            setSelectedIds([res.content[0].id, res.content[1].id]);
          }
        })
        .catch(() => {});
    }
  }, [projectId]);

  // Execute comparison when selectedIds change
  useEffect(() => {
    if (selectedIds.length < 2) {
      setComparisonResponse(null);
      return;
    }

    setLoading(true);
    setError(null);

    compareScenarios({ scenarioIds: selectedIds.slice(0, 10) })
      .then((res) => {
        setComparisonResponse(res);
        setActivePairIndex(0);
      })
      .catch((err: any) => {
        setError(err?.message || 'Comparison failed. Ensure all scenarios have been executed with completed results.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedIds]);

  function handleToggleScenario(id: string) {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 2) {
        alert('At least 2 scenarios are required for side-by-side comparison.');
        return;
      }
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    } else {
      if (selectedIds.length >= 10) {
        alert('Cannot compare more than 10 scenarios concurrently.');
        return;
      }
      setSelectedIds((prev) => [...prev, id]);
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {projectId ? (
          <Link to={`/projects/${projectId}`} className="hover:text-emerald-700 transition flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Project Workspace
          </Link>
        ) : (
          <Link to="/workspaces" className="hover:text-emerald-700 transition flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Workspaces
          </Link>
        )}
        <span>/</span>
        <span className="font-semibold text-slate-800">Scenario Comparison Engine</span>
      </div>

      {/* Mandatory Statutory & Descriptive Disclaimer */}
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <Info className="h-5 w-5 text-indigo-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-indigo-950 leading-relaxed">
            <h4 className="font-bold text-sm text-indigo-950">Descriptive Comparison Notice</h4>
            <p className="font-medium text-indigo-900">
              The comparison engine provides descriptive differences between persisted scenario results. It does not rank scenarios, select a preferred scenario, recommend policy, or predict future outcomes.
            </p>
            <p className="text-indigo-700 text-[11px]">
              Pairwise numerical deltas are defined symmetrically as: <span className="font-mono font-bold">&Delta; = Right Scenario &minus; Left Scenario</span>. Missing distribution categories are treated as zero.
            </p>
          </div>
        </div>
      </div>

      {/* Scenario Target Selector */}
      {availableScenarios.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Select Scenarios for Comparison ({selectedIds.length}/10 selected):</span>
            <span className="text-slate-500 font-normal">Min 2 &bull; Max 10</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {availableScenarios.map((s) => {
              const isSelected = selectedIds.includes(s.id);
              const hasResult = !!s.latestResult;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleToggleScenario(s.id)}
                  disabled={!hasResult}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition border ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                      : hasResult
                      ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                  title={!hasResult ? 'Scenario has not been executed yet' : s.name}
                >
                  <span className="truncate max-w-[200px]">{s.name}</span>
                  {!hasResult && <span className="text-[10px] italic">(Unrun)</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-3 text-sm text-slate-500">Computing deterministic pairwise comparison deltas...</p>
        </div>
      )}

      {/* Content */}
      {!loading && comparisonResponse && (
        <div className="space-y-8">
          {/* 1. Side-by-Side Metadata & Core Metrics Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Evaluated Scenarios ({comparisonResponse.scenarios.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="p-3 text-slate-700 font-bold min-w-[200px]">Metric / Parameter</th>
                    {comparisonResponse.scenarios.map((sc, i) => (
                      <th key={sc.scenarioId} className="p-3 min-w-[180px]">
                        <div className="text-slate-900 font-bold text-xs">{sc.scenarioName}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Scenario {String.fromCharCode(65 + i)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  <tr>
                    <td className="p-3 font-semibold text-slate-600">Intervention Type</td>
                    {comparisonResponse.scenarios.map((sc) => (
                      <td key={sc.scenarioId} className="p-3">
                        <ScenarioTypeBadge type={sc.scenarioType} size="sm" />
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-slate-600">Execution Snapshot</td>
                    {comparisonResponse.scenarios.map((sc) => (
                      <td key={sc.scenarioId} className="p-3 text-slate-600">
                        {new Date(sc.executedAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-slate-50/40">
                    <td className="p-3 font-semibold text-slate-700">Parcels Evaluated</td>
                    {comparisonResponse.scenarios.map((sc) => (
                      <td key={sc.scenarioId} className="p-3 font-mono font-medium text-slate-900">
                        {sc.metrics.totalParcelsEvaluated.toLocaleString()}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-slate-700">Parcels Affected</td>
                    {comparisonResponse.scenarios.map((sc) => (
                      <td key={sc.scenarioId} className="p-3 font-mono font-bold text-blue-700">
                        {sc.metrics.totalParcelsAffected.toLocaleString()}
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-slate-50/40">
                    <td className="p-3 font-semibold text-slate-700">Total Area Affected</td>
                    {comparisonResponse.scenarios.map((sc) => (
                      <td key={sc.scenarioId} className="p-3 font-mono font-bold text-emerald-700">
                        {(sc.metrics.totalAreaAffectedSqm / 10000).toFixed(2)} ha
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {Number(sc.metrics.totalAreaAffectedSqm).toLocaleString()} m²
                        </span>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-slate-700">Baseline Area</td>
                    {comparisonResponse.scenarios.map((sc) => (
                      <td key={sc.scenarioId} className="p-3 font-mono text-slate-700">
                        {(sc.metrics.baselineAreaSqm / 10000).toFixed(2)} ha
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-slate-50/40">
                    <td className="p-3 font-semibold text-slate-700">Simulated Area</td>
                    {comparisonResponse.scenarios.map((sc) => (
                      <td key={sc.scenarioId} className="p-3 font-mono text-slate-700">
                        {(sc.metrics.simulatedAreaSqm / 10000).toFixed(2)} ha
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-slate-700">Disputed Parcels</td>
                    {comparisonResponse.scenarios.map((sc) => (
                      <td key={sc.scenarioId} className="p-3 font-mono text-rose-700 font-semibold">
                        {sc.metrics.disputedParcelsCount}
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-slate-50/40">
                    <td className="p-3 font-semibold text-slate-700">Disputed Area Exposure</td>
                    {comparisonResponse.scenarios.map((sc) => (
                      <td key={sc.scenarioId} className="p-3 font-mono text-amber-800">
                        {(sc.metrics.disputedAreaSqm / 10000).toFixed(2)} ha
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-slate-700">Evidence Count</td>
                    {comparisonResponse.scenarios.map((sc) => (
                      <td key={sc.scenarioId} className="p-3 text-slate-700">
                        {sc.evidenceCount} linked items
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Pairwise Comparison Matrix */}
          {comparisonResponse.comparisons.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pairwise Delta Analysis (&Delta; = Right &minus; Left)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select a scenario pair to view categorical land use and ownership distribution deltas.
                  </p>
                </div>

                {/* Pair Selector Buttons */}
                <div className="flex flex-wrap gap-2">
                  {comparisonResponse.comparisons.map((pair, idx) => (
                    <button
                      key={`${pair.leftScenarioId}-${pair.rightScenarioId}`}
                      type="button"
                      onClick={() => setActivePairIndex(idx)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition border ${
                        activePairIndex === idx
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pair.leftScenarioName} &harr; {pair.rightScenarioName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Pair Comparison View */}
              {comparisonResponse.comparisons[activePairIndex] && (
                <div className="space-y-6">
                  {(() => {
                    const p = comparisonResponse.comparisons[activePairIndex];
                    const md = p.metricDeltas;

                    return (
                      <>
                        {/* Pairwise Metric Deltas Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                              Parcels Evaluated &Delta;
                            </span>
                            <span className="text-base font-bold text-slate-900 font-mono">
                              {md.totalParcelsEvaluated > 0 ? `+${md.totalParcelsEvaluated}` : md.totalParcelsEvaluated}
                            </span>
                          </div>

                          <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-3.5">
                            <span className="text-blue-600 block text-[10px] uppercase font-semibold">
                              Parcels Affected &Delta;
                            </span>
                            <span className="text-base font-bold text-blue-900 font-mono">
                              {md.totalParcelsAffected > 0 ? `+${md.totalParcelsAffected}` : md.totalParcelsAffected}
                            </span>
                            {md.affectedParcelsPercentagePointDelta !== null && md.affectedParcelsPercentagePointDelta !== undefined && (
                              <span className="block text-[11px] text-blue-700 mt-0.5">
                                {md.affectedParcelsPercentagePointDelta > 0 ? `+${md.affectedParcelsPercentagePointDelta}` : md.affectedParcelsPercentagePointDelta} pp
                              </span>
                            )}
                          </div>

                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3.5">
                            <span className="text-emerald-700 block text-[10px] uppercase font-semibold">
                              Affected Area &Delta;
                            </span>
                            <span className="text-base font-bold text-emerald-900 font-mono">
                              {(md.totalAreaAffectedSqm / 10000).toFixed(2)} ha
                            </span>
                            <span className="block text-[11px] text-emerald-700 mt-0.5">
                              {Number(md.totalAreaAffectedSqm).toLocaleString()} m²
                            </span>
                          </div>

                          <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-3.5">
                            <span className="text-rose-700 block text-[10px] uppercase font-semibold">
                              Disputed Parcels &Delta;
                            </span>
                            <span className="text-base font-bold text-rose-900 font-mono">
                              {md.disputedParcelsCount > 0 ? `+${md.disputedParcelsCount}` : md.disputedParcelsCount}
                            </span>
                            <span className="block text-[11px] text-rose-700 mt-0.5">
                              {(md.disputedAreaSqm / 10000).toFixed(2)} ha disputed &Delta;
                            </span>
                          </div>
                        </div>

                        {/* Distribution Deltas Tables */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Land Use Distribution Deltas */}
                          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                              Land-Use Distribution Deltas
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-semibold text-slate-500">
                                    <th className="p-2">Category</th>
                                    <th className="p-2 text-right">Left %</th>
                                    <th className="p-2 text-right">Right %</th>
                                    <th className="p-2 text-right">Diff (pp)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                  {p.landUseDistributionDeltas.map((d) => (
                                    <tr key={d.category} className="hover:bg-slate-50/50">
                                      <td className="p-2 font-medium text-slate-900">{d.category}</td>
                                      <td className="p-2 text-right font-mono text-slate-600">{d.leftAreaPercentage}%</td>
                                      <td className="p-2 text-right font-mono text-slate-600">{d.rightAreaPercentage}%</td>
                                      <td className="p-2 text-right font-mono font-bold">
                                        <span
                                          className={
                                            d.areaPercentagePointDelta > 0
                                              ? 'text-emerald-700'
                                              : d.areaPercentagePointDelta < 0
                                              ? 'text-blue-700'
                                              : 'text-slate-500'
                                          }
                                        >
                                          {d.areaPercentagePointDelta > 0 ? `+${d.areaPercentagePointDelta}` : d.areaPercentagePointDelta} pp
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Ownership Distribution Deltas */}
                          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                              Ownership Distribution Deltas
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-semibold text-slate-500">
                                    <th className="p-2">Category</th>
                                    <th className="p-2 text-right">Left %</th>
                                    <th className="p-2 text-right">Right %</th>
                                    <th className="p-2 text-right">Diff (pp)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                  {p.ownershipDistributionDeltas.map((d) => (
                                    <tr key={d.category} className="hover:bg-slate-50/50">
                                      <td className="p-2 font-medium text-slate-900">{d.category}</td>
                                      <td className="p-2 text-right font-mono text-slate-600">{d.leftAreaPercentage}%</td>
                                      <td className="p-2 text-right font-mono text-slate-600">{d.rightAreaPercentage}%</td>
                                      <td className="p-2 text-right font-mono font-bold">
                                        <span
                                          className={
                                            d.areaPercentagePointDelta > 0
                                              ? 'text-emerald-700'
                                              : d.areaPercentagePointDelta < 0
                                              ? 'text-blue-700'
                                              : 'text-slate-500'
                                          }
                                        >
                                          {d.areaPercentagePointDelta > 0 ? `+${d.areaPercentagePointDelta}` : d.areaPercentagePointDelta} pp
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
