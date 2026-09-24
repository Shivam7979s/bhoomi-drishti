import { useEffect } from 'react';
import { AlertCircle, AlertTriangle, ArrowRight, Database, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../../services/apiClient';
import { GovernanceBreakdownSection } from '../components/GovernanceBreakdownSection';
import { GovernanceIndicatorsTable } from '../components/GovernanceIndicatorsTable';
import { GovernanceKpiCards } from '../components/GovernanceKpiCards';
import { GovernanceMetadataHeader } from '../components/GovernanceMetadataHeader';
import { GovernanceScopeSelector } from '../components/GovernanceScopeSelector';
import { useGovernanceSummary } from '../hooks/useGovernanceSummary';

export function GovernanceDashboardPage() {
  const {
    scopeType,
    state,
    district,
    tehsil,
    village,
    projectId,
    category,
    summary,
    loading,
    error,
    gisOptions,
    accessibleProjects,
    loadingOptions,
    isScopeValid,
    setScopeType,
    setState,
    setDistrict,
    setTehsil,
    setVillage,
    setProjectId,
    setCategory,
    refetch,
  } = useGovernanceSummary();

  useEffect(() => {
    document.title = 'Governance Analytics Dashboard | BHOOMI-DRISHTI';
  }, []);

  // Determine whether an error is a 404 project IDOR / not found condition
  const isProjectNotFound =
    scopeType === 'PROJECT' && error instanceof ApiError && error.status === 404;

  // Determine whether the scope returned valid zero-data (not an error!)
  const isZeroData =
    summary &&
    summary.indicators.every((i) => i.numericValue === 0) &&
    (summary.indicators[0]?.denominator === 0 || summary.indicators[0]?.denominator == null);

  return (
    <div className="space-y-6">
      {/* Scope Selector Section */}
      <GovernanceScopeSelector
        scopeType={scopeType}
        state={state}
        district={district}
        tehsil={tehsil}
        village={village}
        projectId={projectId}
        category={category}
        gisOptions={gisOptions}
        accessibleProjects={accessibleProjects}
        loading={loading}
        loadingOptions={loadingOptions}
        isScopeValid={isScopeValid}
        onScopeTypeChange={setScopeType}
        onStateChange={setState}
        onDistrictChange={setDistrict}
        onTehsilChange={setTehsil}
        onVillageChange={setVillage}
        onProjectIdChange={setProjectId}
        onCategoryChange={setCategory}
        onRefresh={refetch}
      />

      {/* Incomplete Scope Selection Prompt */}
      {!isScopeValid && !loading && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
          <Database className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">Complete Administrative Scope Selection</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Please select all required hierarchy levels for the <strong>{scopeType}</strong> scope above to evaluate live governance metrics.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-slate-100 bg-white shadow-xs">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm font-medium text-slate-700">Evaluating live governance indicators...</p>
          <p className="text-xs text-slate-400 mt-1">Executing deterministic PostGIS aggregations over current cadastral records</p>
        </div>
      )}

      {/* Error State: 404 Project Not Found / IDOR Safe */}
      {!loading && isProjectNotFound && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-800">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-500 mb-2" />
          <h3 className="text-base font-bold">Project Not Found or Inaccessible</h3>
          <p className="mt-1 text-xs text-rose-700 max-w-md mx-auto">
            The requested project summary cannot be loaded. The project may not exist, or you may lack view permissions under collaboration security rules.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              to="/workspaces"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 shadow-xs hover:bg-slate-50 transition"
            >
              Browse Accessible Workspaces
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={refetch}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Error State: General API Failure */}
      {!loading && error && !isProjectNotFound && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-800">
          <AlertTriangle className="mx-auto h-10 w-10 text-rose-500 mb-2" />
          <h3 className="text-base font-bold">Failed to Load Governance Summary</h3>
          <p className="mt-1 text-xs text-rose-700 max-w-md mx-auto">
            {error.message || 'An unexpected error occurred while communicating with the governance calculation service.'}
          </p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Request
          </button>
        </div>
      )}

      {/* Empty Data Scope Banner (Valid Scope with 0 records) */}
      {!loading && !error && summary && isZeroData && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-center gap-3">
          <Database className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <strong className="font-semibold">Valid Administrative Scope Evaluated:</strong> No cadastral land records are currently registered for this boundary. Indicator counts and areas are 0.
          </div>
        </div>
      )}

      {/* Populated Dashboard Content */}
      {!loading && !error && summary && (
        <div className="space-y-6">
          {/* Metadata Header */}
          <GovernanceMetadataHeader
            scope={summary.scope}
            summaryMode={summary.summaryMode}
            calculationVersion={summary.calculationVersion}
            generatedAt={summary.generatedAt}
            sourceDataTimestamp={summary.sourceDataTimestamp}
            totalIndicatorsEvaluated={summary.totalIndicatorsEvaluated}
          />

          {/* Executive KPI Cards */}
          <GovernanceKpiCards indicators={summary.indicators} />

          {/* Categorized Breakdowns (Recharts) */}
          <GovernanceBreakdownSection indicators={summary.indicators} />

          {/* Full Indicators Table */}
          <GovernanceIndicatorsTable indicators={summary.indicators} />
        </div>
      )}
    </div>
  );
}
