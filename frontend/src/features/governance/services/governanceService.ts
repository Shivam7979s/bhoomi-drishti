import { deleteJson, getJson, getJsonWithParams, postJson } from '../../../services/apiClient';
import type {
  BreakdownChartDatum,
  CreateGovernanceSnapshotRequest,
  GovernanceAdministrativeSummaryResponse,
  GovernanceIndicatorDefinitionResponse,
  GovernanceIndicatorEvidenceResponse,
  GovernanceIndicatorSnapshotResponse,
  GovernanceSnapshotQueryParams,
  GovernanceSummaryIndicatorItemResponse,
  GovernanceSummaryQueryParams,
  IndicatorCategory,
  LinkGovernanceEvidenceRequest,
  StatusDistributionSummary,
} from '../types/governance';

/**
 * Fetches the live administrative governance summary for the requested scope.
 * Sends only hierarchy fields relevant to the selected scope type.
 */
export async function fetchAdministrativeSummary(
  params: GovernanceSummaryQueryParams,
  signal?: AbortSignal,
): Promise<GovernanceAdministrativeSummaryResponse> {
  const queryParams: Record<string, string | number | undefined> = {
    scopeType: params.scopeType,
  };

  switch (params.scopeType) {
    case 'STATE':
      queryParams.state = params.state;
      break;
    case 'DISTRICT':
      queryParams.state = params.state;
      queryParams.district = params.district;
      break;
    case 'TEHSIL':
      queryParams.state = params.state;
      queryParams.district = params.district;
      queryParams.tehsil = params.tehsil;
      break;
    case 'VILLAGE':
      queryParams.state = params.state;
      queryParams.district = params.district;
      queryParams.tehsil = params.tehsil;
      queryParams.village = params.village;
      break;
    case 'PROJECT':
      queryParams.projectId = params.projectId;
      break;
  }

  if (params.category) {
    queryParams.category = params.category;
  }

  if (params.indicators) {
    queryParams.indicators = params.indicators;
  }

  return getJsonWithParams<GovernanceAdministrativeSummaryResponse>(
    '/api/governance/summary',
    queryParams,
    15000,
    signal,
  );
}

/**
 * Fetches all active governance indicator definitions, optionally filtered by category.
 */
export async function fetchIndicatorDefinitions(
  category?: IndicatorCategory,
): Promise<GovernanceIndicatorDefinitionResponse[]> {
  const params: Record<string, string | undefined> = {};
  if (category) {
    params.category = category;
  }
  return getJsonWithParams<GovernanceIndicatorDefinitionResponse[]>('/api/governance/indicators', params);
}

/**
 * Fetches detailed metadata definition for a specific indicator code.
 */
export async function fetchIndicatorDefinition(
  code: string,
): Promise<GovernanceIndicatorDefinitionResponse> {
  return getJson<GovernanceIndicatorDefinitionResponse>(`/api/governance/indicators/${encodeURIComponent(code)}`);
}

/**
 * Creates and persists an immutable point-in-time calculation snapshot.
 */
export async function createSnapshot(
  data: CreateGovernanceSnapshotRequest,
): Promise<GovernanceIndicatorSnapshotResponse> {
  return postJson<GovernanceIndicatorSnapshotResponse>('/api/governance/snapshots', data);
}

/**
 * Retrieves a single persisted snapshot by its ID.
 */
export async function fetchSnapshotById(
  id: string,
): Promise<GovernanceIndicatorSnapshotResponse> {
  return getJson<GovernanceIndicatorSnapshotResponse>(`/api/governance/snapshots/${encodeURIComponent(id)}`);
}

/**
 * Queries persisted snapshots matching the given scope hierarchy.
 */
export async function fetchScopeSnapshots(
  params: GovernanceSnapshotQueryParams,
): Promise<GovernanceIndicatorSnapshotResponse[]> {
  const queryParams: Record<string, string | undefined> = {
    scopeType: params.scopeType,
  };
  if (params.state) queryParams.state = params.state;
  if (params.district) queryParams.district = params.district;
  if (params.tehsil) queryParams.tehsil = params.tehsil;
  if (params.village) queryParams.village = params.village;
  if (params.indicatorCode) queryParams.indicatorCode = params.indicatorCode;

  return getJsonWithParams<GovernanceIndicatorSnapshotResponse[]>('/api/governance/snapshots', queryParams);
}

/**
 * Queries all persisted snapshots calculated for a specific collaborative project.
 */
export async function fetchProjectSnapshots(
  projectId: string,
): Promise<GovernanceIndicatorSnapshotResponse[]> {
  return getJson<GovernanceIndicatorSnapshotResponse[]>(`/api/projects/${encodeURIComponent(projectId)}/governance-snapshots`);
}

/**
 * Retrieves all statutory and circular evidence linkages for a snapshot.
 */
export async function fetchSnapshotEvidence(
  snapshotId: string,
): Promise<GovernanceIndicatorEvidenceResponse[]> {
  return getJson<GovernanceIndicatorEvidenceResponse[]>(`/api/governance/snapshots/${encodeURIComponent(snapshotId)}/evidence`);
}

/**
 * Links a research document or specific chunk as statutory evidence to a snapshot.
 */
export async function linkSnapshotEvidence(
  snapshotId: string,
  data: LinkGovernanceEvidenceRequest,
): Promise<GovernanceIndicatorEvidenceResponse> {
  return postJson<GovernanceIndicatorEvidenceResponse>(
    `/api/governance/snapshots/${encodeURIComponent(snapshotId)}/evidence`,
    data,
  );
}

/**
 * Removes a statutory evidence linkage from a snapshot.
 */
export async function unlinkSnapshotEvidence(
  snapshotId: string,
  evidenceId: string,
): Promise<void> {
  return deleteJson<void>(
    `/api/governance/snapshots/${encodeURIComponent(snapshotId)}/evidence/${encodeURIComponent(evidenceId)}`,
  );
}


/**
 * Safely parses a raw JSON string into a key-number map.
 * Never throws; returns an empty record on malformed or empty input.
 */
export function parseBreakdownMap(breakdownJson: string | null | undefined): Record<string, number> {
  if (!breakdownJson || typeof breakdownJson !== 'string') {
    return {};
  }
  try {
    const parsed = JSON.parse(breakdownJson);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const result: Record<string, number> = {};
    for (const [key, val] of Object.entries(parsed)) {
      const num = Number(val);
      if (!Number.isNaN(num)) {
        result[key] = num;
      }
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Converts a parsed breakdown map into chart-friendly data.
 * Does NOT truncate or drop categories.
 */
export function toBreakdownChartData(
  breakdown: Record<string, number>,
  unit: 'COUNT' | 'SQ_METERS' | 'PERCENTAGE' = 'COUNT',
): BreakdownChartDatum[] {
  const entries = Object.entries(breakdown);
  if (entries.length === 0) return [];

  let total = 0;
  for (const [, val] of entries) {
    total += val;
  }

  return entries.map(([name, value]) => {
    let formattedValue: string;
    let percentage: number | undefined;

    if (unit === 'PERCENTAGE') {
      formattedValue = `${value.toFixed(1)}%`;
      percentage = Number(value.toFixed(1));
    } else if (unit === 'SQ_METERS') {
      const ha = (value / 10000).toLocaleString('en-IN', { maximumFractionDigits: 2 });
      formattedValue = `${value.toLocaleString('en-IN', { maximumFractionDigits: 1 })} m² (${ha} ha)`;
      percentage = total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;
    } else {
      formattedValue = value.toLocaleString('en-IN');
      percentage = total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;
    }

    return {
      name: formatCategoryLabel(name),
      value,
      formattedValue,
      percentage,
    };
  });
}

/**
 * Extracts and consolidates cadastral parcel status counts from evaluated indicators.
 */
export function extractStatusSummary(
  indicators: GovernanceSummaryIndicatorItemResponse[],
): StatusDistributionSummary {
  let activeParcels = 0;
  let disputedParcels = 0;
  let pendingVerificationParcels = 0;
  let inactiveParcels = 0;
  let totalParcels = 0;

  for (const ind of indicators) {
    switch (ind.indicatorCode) {
      case 'ACTIVE_PARCEL_COUNT':
        activeParcels = ind.numericValue;
        if (ind.denominator != null && ind.denominator > totalParcels) {
          totalParcels = ind.denominator;
        }
        break;
      case 'DISPUTED_PARCEL_COUNT':
        disputedParcels = ind.numericValue;
        if (ind.denominator != null && ind.denominator > totalParcels) {
          totalParcels = ind.denominator;
        }
        break;
      case 'PENDING_VERIFICATION_COUNT':
        pendingVerificationParcels = ind.numericValue;
        if (ind.denominator != null && ind.denominator > totalParcels) {
          totalParcels = ind.denominator;
        }
        break;
      case 'INACTIVE_PARCEL_COUNT':
        inactiveParcels = ind.numericValue;
        if (ind.denominator != null && ind.denominator > totalParcels) {
          totalParcels = ind.denominator;
        }
        break;
    }
  }

  // Fallback: if denominator was not set, sum known statuses
  if (totalParcels === 0) {
    totalParcels = activeParcels + disputedParcels + pendingVerificationParcels + inactiveParcels;
  }

  return {
    activeParcels,
    disputedParcels,
    pendingVerificationParcels,
    inactiveParcels,
    totalParcels,
  };
}

/**
 * Identifies the dominant category from a parsed breakdown map as a presentation transformation.
 * Returns null if breakdown is empty or all zero.
 */
export function extractDominantCategory(
  breakdown: Record<string, number>,
): { name: string; value: number; formatted: string } | null {
  const entries = Object.entries(breakdown).filter(([, val]) => val > 0);
  if (entries.length === 0) return null;

  entries.sort((a, b) => b[1] - a[1]);
  const [topKey, topVal] = entries[0];
  return {
    name: formatCategoryLabel(topKey),
    value: topVal,
    formatted: topVal.toLocaleString('en-IN', { maximumFractionDigits: 1 }),
  };
}

/**
 * Humanizes snake_case or SCREAMING_SNAKE_CASE category codes.
 */
export function formatCategoryLabel(rawKey: string): string {
  if (!rawKey) return 'Unknown';
  return rawKey
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
