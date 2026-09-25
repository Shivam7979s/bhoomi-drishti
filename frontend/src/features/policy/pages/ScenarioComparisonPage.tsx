import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Scale,
  GitCompare,
  BarChart3,
  Layers,
} from 'lucide-react';
import { AppContainer } from '../../../components/layout/AppContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { AdvisoryBanner } from '../../../components/layout/AdvisoryBanner';
import { EmptyState } from '../../../components/layout/EmptyState';
import { ErrorState } from '../../../components/layout/ErrorState';
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
  const fetchComparison = () => {
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
  };

  useEffect(() => {
    fetchComparison();
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

  const breadcrumbs = projectId
    ? [
        { label: 'Workspaces', to: '/workspaces' },
        { label: 'Project Workspace', to: `/projects/${projectId}` },
        { label: 'Scenario Comparison' },
      ]
    : [
        { label: 'Workspaces', to: '/workspaces' },
        { label: 'Scenario Comparison' },
      ];

  return (
    <AppContainer>
      {/* Institutional Page Header */}
      <PageHeader
        breadcrumbs={breadcrumbs}
        badge={{
          icon: Scale,
          text: 'Policy Simulation & Delta Matrix',
          variant: 'emerald',
        }}
        title="Scenario Comparison Engine"
        description="Multi-scenario side-by-side evaluation, delta matrix computation, and categorical land-use and ownership distribution comparisons."
        actions={
          projectId ? (
            <Link
              to={`/projects/${projectId}`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300"
            >
              <ArrowLeft className="h-4 w-4 text-slate-500" />
              <span>Return to Project</span>
            </Link>
          ) : undefined
        }
      />

      {/* Mandatory Statutory & Descriptive Disclaimer */}
      <AdvisoryBanner
        variant="audit"
        title="Descriptive Comparison Notice"
      >
        <p className="font-medium text-indigo-950">
          The comparison engine provides descriptive differences between persisted scenario results. It does not rank scenarios, select a preferred scenario, recommend policy, or predict future outcomes.
        </p>
        <p className="text-indigo-800 text-[11px]">
          Pairwise numerical deltas are defined symmetrically as: <span className="font-mono font-bold">&Delta; = Right Scenario &minus; Left Scenario</span>. Missing distribution categories are treated as zero.
        </p>
      </AdvisoryBanner>

      {/* Scenario Target Selector */}
      {availableScenarios.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Select Scenarios for Comparison
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Select between 2 and 10 executed policy scenarios for side-by-side comparative analysis.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                {selectedIds.length} / 10 Selected
              </span>
            </div>
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
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs font-semibold'
                      : hasResult
                      ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                      : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
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
        <ErrorState
          title="Comparison Computation Error"
          description={error}
          onRetry={fetchComparison}
          retryLabel="Retry Comparison"
        />
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm font-medium text-slate-700">Computing deterministic pairwise comparison deltas...</p>
          <p className="text-xs text-slate-400 mt-1">Aggregating parcel impact distributions and area metrics</p>
        </div>
      )}

      {/* Empty State when fewer than 2 selected */}
      {!loading && !error && selectedIds.length < 2 && (
        <EmptyState
          icon={GitCompare}
          title="At Least Two Scenarios Required"
          description="Side-by-side comparative analysis requires at least two executed scenarios. Please select two or more scenarios from the selector above."
          action={
            projectId ? (
              <Link
                to={`/projects/${projectId}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Project Scenarios</span>
              </Link>
            ) : undefined
          }
        />
      )}

      {/* Content */}
      {!loading && comparisonResponse && (
        <div className="space-y-8">
          {/* 1. Side-by-Side Metadata & Core Metrics Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-700" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Evaluated Scenarios ({comparisonResponse.scenarios.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Deterministic metrics snapshot</span>
            </div>

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
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="p-3 font-semibold text-slate-600">Intervention Type</td>
                    {comparisonResponse.scenarios.map((sc) => (
                      <td key={sc.scenarioId} className="p-3">
                        <ScenarioTypeBadge type={sc.scenarioType} size="sm" />
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="p-3 font-semibold text-slate-600">Execution Snapshot</td>
                    {comparisonResponse.scenarios.map((sc) => (
                      <td key={sc.scenarioId} className="p-3 text-slate-600 font-mono text-[11px]">
                        {new Date(sc.executedAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-slate-50/40 hover:bg-slate-50 transition">
                    <td className="p-3 font-semibold text-slate-700">Parcels Evaluated</td>
                    {comparisonResponse.scenarios.map((sc) => (
                      <td key={sc.scenarioId} className="p-3 font-mono font-medium text-slate-900">
                        {sc.metrics.totalParcelsEvaluated.toLocaleString()}
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="p-3 font-semibold text-slate-700">Parcels Affected</td>
                    {comparisonResponse.scenarios.map((sc) => (
                      <td key={sc.scenarioId} className="p-3 font-mono font-bold text-blue-700">
                        {sc.metrics.totalParcelsAffected.toLocaleString()}
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-slate-50/40 hover:bg-slate-50 transition">
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

                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="p-3 font-semibold text-slate-700">Baseline Area</td>
                    {comparisonResponse.scenarios.map((sc) => (
                      <td key={sc.scenarioId} className="p-3 font-mono text-slate-700">
                        {(sc.metrics.baselineAreaSqm / 10000).toFixed(2)} ha
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-slate-50/40 hover:bg-slate-50 transition">
                    <td className="p-3 font-semibold text-slate-700">Simulated Area</td>
                    {comparisonResponse.scenarios.map((sc) => (
                      <td key={sc.scenarioId} className="p-3 font-mono text-slate-700">
                        {(sc.metrics.simulatedAreaSqm / 10000).toFixed(2)} ha
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="p-3 font-semibold text-slate-700">Disputed Parcels</td>
                    {comparisonResponse.scenarios.map((sc) => (
                      <td key={sc.scenarioId} className="p-3 font-mono text-rose-700 font-semibold">
                        {sc.metrics.disputedParcelsCount}
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-slate-50/40 hover:bg-slate-50 transition">
                    <td className="p-3 font-semibold text-slate-700">Disputed Area Exposure</td>
                    {comparisonResponse.scenarios.map((sc) => (
                      <td key={sc.scenarioId} className="p-3 font-mono text-amber-800">
                        {(sc.metrics.disputedAreaSqm / 10000).toFixed(2)} ha
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-50/50 transition">
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
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-700" />
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Pairwise Delta Analysis (&Delta; = Right &minus; Left)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
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
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition border ${
                        activePairIndex === idx
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
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
                          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                              Parcels Evaluated &Delta;
                            </span>
                            <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                              {md.totalParcelsEvaluated > 0 ? `+${md.totalParcelsEvaluated.toLocaleString()}` : md.totalParcelsEvaluated.toLocaleString()}
                            </span>
                          </div>

                          <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-4">
                            <span className="text-blue-700 block text-[10px] uppercase font-bold tracking-wider">
                              Parcels Affected &Delta;
                            </span>
                            <span className="text-lg font-bold text-blue-950 font-mono mt-1 block">
                              {md.totalParcelsAffected > 0 ? `+${md.totalParcelsAffected.toLocaleString()}` : md.totalParcelsAffected.toLocaleString()}
                            </span>
                            {md.affectedParcelsPercentagePointDelta !== null && md.affectedParcelsPercentagePointDelta !== undefined && (
                              <span className="block text-[11px] text-blue-700 mt-1 font-medium">
                                {md.affectedParcelsPercentagePointDelta > 0 ? `+${md.affectedParcelsPercentagePointDelta}` : md.affectedParcelsPercentagePointDelta} pp
                              </span>
                            )}
                          </div>

                          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4">
                            <span className="text-emerald-700 block text-[10px] uppercase font-bold tracking-wider">
                              Affected Area &Delta;
                            </span>
                            <span className="text-lg font-bold text-emerald-950 font-mono mt-1 block">
                              {(md.totalAreaAffectedSqm / 10000).toFixed(2)} ha
                            </span>
                            <span className="block text-[11px] text-emerald-700 mt-1 font-medium">
                              {Number(md.totalAreaAffectedSqm).toLocaleString()} m²
                            </span>
                          </div>

                          <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-4">
                            <span className="text-rose-700 block text-[10px] uppercase font-bold tracking-wider">
                              Disputed Parcels &Delta;
                            </span>
                            <span className="text-lg font-bold text-rose-950 font-mono mt-1 block">
                              {md.disputedParcelsCount > 0 ? `+${md.disputedParcelsCount}` : md.disputedParcelsCount}
                            </span>
                            <span className="block text-[11px] text-rose-700 mt-1 font-medium">
                              {(md.disputedAreaSqm / 10000).toFixed(2)} ha disputed &Delta;
                            </span>
                          </div>
                        </div>

                        {/* Distribution Deltas Tables */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Land Use Distribution Deltas */}
                          <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3">
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
                                    <tr key={d.category} className="hover:bg-slate-50/50 transition">
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
                          <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3">
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
                                    <tr key={d.category} className="hover:bg-slate-50/50 transition">
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
    </AppContainer>
  );
}
