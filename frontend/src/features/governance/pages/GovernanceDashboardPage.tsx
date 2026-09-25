import { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Camera,
  Database,
  GitCompare,
  Landmark,
  Loader2,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../../services/apiClient';
import { AppContainer } from '../../../components/layout/AppContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { useAuth } from '../../auth/hooks/useAuth';
import { GovernanceBreakdownSection } from '../components/GovernanceBreakdownSection';
import { GovernanceEvidenceLinkModal } from '../components/GovernanceEvidenceLinkModal';
import { GovernanceIndicatorDetailDrawer } from '../components/GovernanceIndicatorDetailDrawer';
import { GovernanceIndicatorsTable } from '../components/GovernanceIndicatorsTable';
import { GovernanceKpiCards } from '../components/GovernanceKpiCards';
import { GovernanceMetadataHeader } from '../components/GovernanceMetadataHeader';
import { GovernanceScopeSelector } from '../components/GovernanceScopeSelector';
import { GovernanceSnapshotAuditList } from '../components/GovernanceSnapshotAuditList';
import { GovernanceSnapshotModal } from '../components/GovernanceSnapshotModal';
import { useGovernanceSummary } from '../hooks/useGovernanceSummary';
import type {
  GovernanceIndicatorSnapshotResponse,
  GovernanceSummaryIndicatorItemResponse,
} from '../types/governance';

export function GovernanceDashboardPage() {
  const { user } = useAuth();
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

  // Phase 9B.4 Evidence & Snapshot State
  const [selectedIndicatorForDetail, setSelectedIndicatorForDetail] =
    useState<GovernanceSummaryIndicatorItemResponse | null>(null);
  const [showSnapshotModal, setShowSnapshotModal] = useState<boolean>(false);
  const [snapshotForEvidenceLink, setSnapshotForEvidenceLink] =
    useState<GovernanceIndicatorSnapshotResponse | null>(null);
  const [auditRefreshKey, setAuditRefreshKey] = useState<number>(0);

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

  // Authority check for snapshot capture
  const canCaptureSnapshot =
    user?.role === 'GOVERNMENT_OFFICIAL' ||
    user?.role === 'ADMIN' ||
    scopeType === 'PROJECT';

  return (
    <AppContainer>
      {/* Sovereign Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Explore', to: '/explore' },
          { label: 'Governance Intelligence' },
        ]}
        badge={{
          text: 'Revenue Intelligence',
          icon: Landmark,
          variant: 'emerald',
        }}
        title="Governance Intelligence Framework"
        description="Monitor standardized revenue indicators, mutation timeliness, dispute distributions, and point-in-time audit snapshots across multi-tier administrative jurisdictions."
        actions={
          <>
            <Link
              to="/governance/compare"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-emerald-900 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <GitCompare className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <span>Temporal Comparisons</span>
            </Link>
            <button
              type="button"
              onClick={refetch}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>Refresh</span>
            </button>
          </>
        }
      />

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
          {/* Metadata Header with Actions */}
          <div className="space-y-3">
            <GovernanceMetadataHeader
              scope={summary.scope}
              summaryMode={summary.summaryMode}
              calculationVersion={summary.calculationVersion}
              generatedAt={summary.generatedAt}
              sourceDataTimestamp={summary.sourceDataTimestamp}
              totalIndicatorsEvaluated={summary.totalIndicatorsEvaluated}
            />

            {/* Explicit Semantics & Audit Snapshot Action Banner */}
            <div className="rounded-xl border border-slate-200 bg-linear-to-r from-slate-50 via-white to-blue-50/40 p-4 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100/70 text-emerald-800 border border-emerald-200 shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                      LIVE
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Active Cadastral Computation
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Dashboard indicators represent dynamic, point-in-time aggregations calculated over current cadastral records.
                    Freezing an audit snapshot captures an immutable baseline for statutory compliance without altering live data.
                  </p>
                </div>
              </div>

              {canCaptureSnapshot && (
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSnapshotModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                  >
                    <Camera className="h-4 w-4 text-emerald-400" />
                    <span>Capture Audit Snapshot</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Executive KPI Cards */}
          <GovernanceKpiCards indicators={summary.indicators} />

          {/* Categorized Breakdowns (Recharts) */}
          <GovernanceBreakdownSection indicators={summary.indicators} />

          {/* Full Indicators Table with Evidence Drawer Hook */}
          <GovernanceIndicatorsTable
            indicators={summary.indicators}
            onSelectIndicator={setSelectedIndicatorForDetail}
          />

          {/* Immutable Audit Snapshots Archive for this scope */}
          <GovernanceSnapshotAuditList
            key={auditRefreshKey}
            scopeType={scopeType}
            state={state}
            district={district}
            tehsil={tehsil}
            village={village}
            projectId={projectId}
            canContribute={canCaptureSnapshot}
            onSelectSnapshotForEvidence={(snap) => {
              // Open evidence drawer for that indicator
              const match: GovernanceSummaryIndicatorItemResponse = summary.indicators.find(
                (i) => i.indicatorCode === snap.indicatorCode,
              ) || {
                indicatorCode: snap.indicatorCode,
                indicatorName: snap.indicatorName,
                category: snap.category,
                unit: snap.unit,
                aggregationMethod: 'COUNT',
                numericValue: snap.numericValue,
                denominator: snap.denominator,
                breakdownJson: snap.breakdownJson || '{}',
                sourceDataTimestamp: snap.sourceDataTimestamp,
              };
              setSelectedIndicatorForDetail(match);
            }}
            onOpenLinkEvidenceModal={(snap) => setSnapshotForEvidenceLink(snap)}
          />
        </div>
      )}

      {/* METHODOLOGY & STATUTORY EVIDENCE DRAWER */}
      <GovernanceIndicatorDetailDrawer
        indicator={selectedIndicatorForDetail}
        scopeType={scopeType}
        state={state}
        district={district}
        tehsil={tehsil}
        village={village}
        onClose={() => setSelectedIndicatorForDetail(null)}
      />

      {/* CAPTURE AUDIT SNAPSHOT MODAL */}
      {summary && (
        <GovernanceSnapshotModal
          isOpen={showSnapshotModal}
          onClose={() => setShowSnapshotModal(false)}
          onSuccess={() => {
            setAuditRefreshKey((k) => k + 1);
          }}
          scopeType={scopeType}
          state={state}
          district={district}
          tehsil={tehsil}
          village={village}
          projectId={projectId}
          indicators={summary.indicators}
        />
      )}

      {/* LINK STATUTORY EVIDENCE MODAL */}
      <GovernanceEvidenceLinkModal
        isOpen={!!snapshotForEvidenceLink}
        onClose={() => setSnapshotForEvidenceLink(null)}
        onSuccess={() => {
          setAuditRefreshKey((k) => k + 1);
          setSnapshotForEvidenceLink(null);
        }}
        snapshot={snapshotForEvidenceLink}
      />
    </AppContainer>
  );
}
