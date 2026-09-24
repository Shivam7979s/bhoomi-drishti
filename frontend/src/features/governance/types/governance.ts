export type GovernanceScopeType = 'STATE' | 'DISTRICT' | 'TEHSIL' | 'VILLAGE' | 'PROJECT';

export type IndicatorCategory = 'LAND_USE' | 'OWNERSHIP' | 'STATUS_DISTRIBUTION';

export type IndicatorUnit = 'COUNT' | 'SQ_METERS' | 'PERCENTAGE';

export type AggregationMethod = 'COUNT' | 'SUM' | 'PERCENTAGE_SHARE';

/**
 * Scope hierarchy returned by the backend in the summary response.
 */
export interface GovernanceScopeSummaryResponse {
  scopeType: GovernanceScopeType;
  state: string | null;
  district: string | null;
  tehsil: string | null;
  village: string | null;
  projectId: string | null;
  projectName: string | null;
}

/**
 * Individual evaluated indicator item within an administrative summary.
 */
export interface GovernanceSummaryIndicatorItemResponse {
  indicatorCode: string;
  indicatorName: string;
  category: IndicatorCategory;
  unit: IndicatorUnit;
  aggregationMethod: AggregationMethod;
  numericValue: number;
  denominator: number | null;
  breakdownJson: string;
  sourceDataTimestamp: string;
}

/**
 * Server response for GET /api/governance/summary.
 */
export interface GovernanceAdministrativeSummaryResponse {
  scope: GovernanceScopeSummaryResponse;
  summaryMode: 'LIVE';
  generatedAt: string;
  sourceDataTimestamp: string;
  calculationVersion: string;
  totalIndicatorsEvaluated: number;
  indicators: GovernanceSummaryIndicatorItemResponse[];
}

/**
 * Query parameters for requesting an administrative summary.
 */
export interface GovernanceSummaryQueryParams {
  scopeType: GovernanceScopeType;
  state?: string;
  district?: string;
  tehsil?: string;
  village?: string;
  projectId?: string;
  category?: IndicatorCategory;
  indicators?: string;
}

/**
 * Parsed breakdown chart datum for distribution views (Land Use / Ownership).
 */
export interface BreakdownChartDatum {
  name: string;
  value: number;
  formattedValue: string;
  percentage?: number;
}

/**
 * Parsed cadastral status distribution summary.
 */
export interface StatusDistributionSummary {
  activeParcels: number;
  disputedParcels: number;
  pendingVerificationParcels: number;
  inactiveParcels: number;
  totalParcels: number;
}
