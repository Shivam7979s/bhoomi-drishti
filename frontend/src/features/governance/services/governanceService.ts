import { getJsonWithParams } from '../../../services/apiClient';
import type {
  BreakdownChartDatum,
  GovernanceAdministrativeSummaryResponse,
  GovernanceSummaryIndicatorItemResponse,
  GovernanceSummaryQueryParams,
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
