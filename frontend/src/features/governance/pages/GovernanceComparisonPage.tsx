import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  RefreshCw,
  Scale,
} from 'lucide-react';
import { ApiError } from '../../../services/apiClient';
import { AppContainer } from '../../../components/layout/AppContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { AdvisoryBanner } from '../../../components/layout/AdvisoryBanner';
import {
  compareGovernanceSnapshots,
  fetchProjectSnapshots,
  fetchScopeSnapshots,
  fetchSnapshotById,
} from '../services/governanceService';
import { GovernanceComparisonSelector } from '../components/GovernanceComparisonSelector';
import { GovernanceComparisonView } from '../components/GovernanceComparisonView';
import type {
  GovernanceComparisonResponse,
  GovernanceIndicatorSnapshotResponse,
  GovernanceScopeType,
} from '../types/governance';

export function GovernanceComparisonPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query Parameters
  const initialBaselineId = searchParams.get('baseline') || '';
  const initialTargetId = searchParams.get('target') || '';
  const initialLiveParam = searchParams.get('live') === 'true';
  const initialScopeType = (searchParams.get('scopeType') as GovernanceScopeType) || 'STATE';
  const initialProjectId = searchParams.get('projectId') || '';
  const initialState = searchParams.get('state') || '';
  const initialDistrict = searchParams.get('district') || '';
  const initialTehsil = searchParams.get('tehsil') || '';
  const initialVillage = searchParams.get('village') || '';

  // Local Selection State
  const [baselineSnapshotId, setBaselineSnapshotId] = useState<string>(initialBaselineId);
  const [targetSnapshotId, setTargetSnapshotId] = useState<string>(initialTargetId);
  const [compareToLive, setCompareToLive] = useState<boolean>(initialLiveParam);

  // Scope context for candidate retrieval
  const [scopeType, setScopeType] = useState<GovernanceScopeType>(initialScopeType);
  const [projectId, setProjectId] = useState<string>(initialProjectId);
  const [stateName, setStateName] = useState<string>(initialState);
  const [districtName, setDistrictName] = useState<string>(initialDistrict);
  const [tehsilName, setTehsilName] = useState<string>(initialTehsil);
  const [villageName, setVillageName] = useState<string>(initialVillage);

  // Candidate snapshots list
  const [snapshots, setSnapshots] = useState<GovernanceIndicatorSnapshotResponse[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState<boolean>(false);
  const [snapshotLoadError, setSnapshotLoadError] = useState<string | null>(null);

  // Comparison execution state
  const [comparison, setComparison] = useState<GovernanceComparisonResponse | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<ApiError | Error | null>(null);

  useEffect(() => {
    document.title = 'Temporal Governance Audit Comparison | BHOOMI-DRISHTI';
  }, []);

  // 1. Fetch candidate snapshots for the current scope
  const loadCandidateSnapshots = useCallback(async () => {
    setLoadingSnapshots(true);
    setSnapshotLoadError(null);
    try {
      let data: GovernanceIndicatorSnapshotResponse[] = [];
      if (scopeType === 'PROJECT' && projectId) {
        data = await fetchProjectSnapshots(projectId);
      } else {
        data = await fetchScopeSnapshots({
          scopeType,
          state: stateName || undefined,
          district: districtName || undefined,
          tehsil: tehsilName || undefined,
          village: villageName || undefined,
        });
      }
      setSnapshots(data);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        setSnapshotLoadError('The requested administrative scope or project snapshots could not be found or you lack permission to view them.');
      } else {
        setSnapshotLoadError(err instanceof Error ? err.message : 'Failed to load snapshots for comparison');
      }
    } finally {
      setLoadingSnapshots(false);
    }
  }, [scopeType, projectId, stateName, districtName, tehsilName, villageName]);

  // If a baseline snapshot ID is in query params without scope info, resolve its scope first
  useEffect(() => {
    async function resolveBaselineScope() {
      if (initialBaselineId && !initialProjectId && !initialState) {
        try {
          const baseSnap = await fetchSnapshotById(initialBaselineId);
          if (baseSnap) {
            setScopeType(baseSnap.scopeType);
            if (baseSnap.projectId) setProjectId(baseSnap.projectId);
            if (baseSnap.state) setStateName(baseSnap.state);
            if (baseSnap.district) setDistrictName(baseSnap.district);
            if (baseSnap.tehsil) setTehsilName(baseSnap.tehsil);
            if (baseSnap.village) setVillageName(baseSnap.village);
          }
        } catch {
          // If baseline not found, backend will return 404 on compare
        }
      }
    }
    resolveBaselineScope();
  }, [initialBaselineId, initialProjectId, initialState]);

  useEffect(() => {
    loadCandidateSnapshots();
  }, [loadCandidateSnapshots]);

  // 2. Execute Comparison Function
  const executeComparison = useCallback(async (
    baseId: string,
    targetId: string,
    toLive: boolean,
  ) => {
    if (!baseId || (!toLive && !targetId)) return;

    setIsComparing(true);
    setCompareError(null);

    try {
      const response = await compareGovernanceSnapshots({
        baselineSnapshotId: baseId,
        targetSnapshotId: toLive ? null : targetId,
        compareToLive: toLive,
      });
      setComparison(response);

      // Synchronize URL search params cleanly without storing sensitive auth data
      const newParams = new URLSearchParams();
      newParams.set('baseline', baseId);
      if (toLive) {
        newParams.set('live', 'true');
      } else {
        newParams.set('target', targetId);
      }
      if (scopeType) newParams.set('scopeType', scopeType);
      if (projectId) newParams.set('projectId', projectId);
      if (stateName) newParams.set('state', stateName);
      if (districtName) newParams.set('district', districtName);
      if (tehsilName) newParams.set('tehsil', tehsilName);
      if (villageName) newParams.set('village', villageName);

      setSearchParams(newParams, { replace: true });
    } catch (err: unknown) {
      setCompareError(err instanceof ApiError || err instanceof Error ? err : new Error('Comparison failed'));
      setComparison(null);
    } finally {
      setIsComparing(false);
    }
  }, [scopeType, projectId, stateName, districtName, tehsilName, villageName, setSearchParams]);

  // Auto-compare on initial mount if valid IDs are present in URL
  useEffect(() => {
    if (initialBaselineId && (initialLiveParam || initialTargetId)) {
      executeComparison(initialBaselineId, initialTargetId, initialLiveParam);
    }
  }, [initialBaselineId, initialTargetId, initialLiveParam, executeComparison]);

  const handleRunComparison = () => {
    executeComparison(baselineSnapshotId, targetSnapshotId, compareToLive);
  };

  const is404NotFound = compareError instanceof ApiError && compareError.status === 404;
  const is400BadRequest = compareError instanceof ApiError && compareError.status === 400;

  const breadcrumbs = [
    { label: 'Home', to: '/' },
    { label: 'Governance', to: '/governance' },
    ...(projectId ? [{ label: 'Project Workspace', to: `/projects/${projectId}` }] : []),
    { label: 'Temporal Comparison' },
  ];

  return (
    <AppContainer>
      {/* Sovereign Page Header */}
      <PageHeader
        breadcrumbs={breadcrumbs}
        badge={{
          text: 'Temporal Variance Engine',
          icon: Scale,
          variant: 'indigo',
        }}
        title="Temporal Governance Audit Comparison"
        description="Evaluate deterministic mathematical variances between verified, immutable point-in-time calculation snapshots and the active cadastral state."
      />

      {/* Mandatory Statutory & Descriptive Notice Banner */}
      <AdvisoryBanner
        variant="audit"
        title="Descriptive Governance Audit Notice"
      >
        <p className="font-medium text-slate-900">
          The Temporal Governance Audit Comparison Engine evaluates deterministic mathematical variances between verified, immutable point-in-time calculation snapshots and the active cadastral state.
        </p>
        <p className="text-slate-600 text-[11px] pt-1">
          This engine is purely descriptive: it does not rank administrative authorities, evaluate governance health, recommend policy choices, or predict future cadastral outcomes. Missing distribution categories remain distinct from zero (<span className="font-mono">&mdash;</span>), and indicator directionality is strictly non-evaluative (<span className="font-mono">NOT_DEFINED</span>).
        </p>
      </AdvisoryBanner>

      {/* Snapshot Loading Error Notice */}
      {snapshotLoadError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{snapshotLoadError}</span>
          </div>
          <button
            type="button"
            onClick={loadCandidateSnapshots}
            className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-white px-2 py-1 text-[11px] font-semibold text-rose-800 hover:bg-rose-50"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {/* Snapshot Target Selector Component */}
      <GovernanceComparisonSelector
        snapshots={snapshots}
        loadingSnapshots={loadingSnapshots}
        baselineSnapshotId={baselineSnapshotId}
        targetSnapshotId={targetSnapshotId}
        compareToLive={compareToLive}
        onBaselineChange={setBaselineSnapshotId}
        onTargetChange={setTargetSnapshotId}
        onCompareToLiveChange={setCompareToLive}
        onCompare={handleRunComparison}
        isComparing={isComparing}
        onRefreshSnapshots={loadCandidateSnapshots}
      />

      {/* Comparison Loading State */}
      {isComparing && (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-slate-100 bg-white shadow-xs">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-3 text-sm font-medium text-slate-800">
            Executing deterministic temporal governance comparison...
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Computing quantitative deltas, categorical distribution variances, and statutory evidence provenance
          </p>
        </div>
      )}

      {/* Error State: 404 Not Found / Concealed Resource */}
      {!isComparing && is404NotFound && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-800 shadow-sm space-y-3">
          <AlertCircle className="mx-auto h-10 w-10 text-slate-400 mb-1" />
          <h3 className="text-base font-bold text-slate-900">Snapshot or Project Inaccessible</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The requested comparison could not be completed because one or more specified snapshots or projects do not exist or are not accessible under your current permissions.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/governance"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              Return to Governance Dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Error State: 400 Semantic Compatibility / Validation Error */}
      {!isComparing && is400BadRequest && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-950">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>Incompatible Comparison Targets</span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            {compareError.message || 'The specified snapshots cannot be compared. Snapshots must evaluate the same indicator across the identical administrative or project scope.'}
          </p>
        </div>
      )}

      {/* Error State: General Server / Network Failure */}
      {!isComparing && compareError && !is404NotFound && !is400BadRequest && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-900 shadow-xs space-y-3">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />
          <h3 className="text-sm font-bold text-rose-950">Comparison Calculation Error</h3>
          <p className="text-xs text-rose-800 max-w-md mx-auto">
            {compareError.message || 'An unexpected error occurred while communicating with the governance comparison service.'}
          </p>
          <button
            type="button"
            onClick={handleRunComparison}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Comparison
          </button>
        </div>
      )}

      {/* Empty State (No Comparison Executed Yet) */}
      {!isComparing && !compareError && !comparison && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-12 text-center text-slate-600 space-y-2">
          <Scale className="mx-auto h-10 w-10 text-slate-400 mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">Ready for Temporal Audit Comparison</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select a baseline snapshot and comparison target above, then click <strong>"Execute Temporal Comparison"</strong> to view quantitative deltas, distribution changes, and statutory evidence variances.
          </p>
        </div>
      )}

      {/* Populated Comparison Result View */}
      {!isComparing && !compareError && comparison && (
        <GovernanceComparisonView comparison={comparison} />
      )}
    </AppContainer>
  );
}
