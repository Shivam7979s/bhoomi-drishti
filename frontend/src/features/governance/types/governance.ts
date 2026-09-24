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

/**
 * Statutory and circular evidence classification for governance indicators.
 */
export type GovernanceEvidenceType =
  | 'STATUTORY_BENCHMARK'
  | 'ADMINISTRATIVE_CIRCULAR'
  | 'AUDIT_PRECEDENT'
  | 'METHODOLOGICAL_STANDARD'
  | 'POLICY_FRAMEWORK';

export type SnapshotVisibility = 'INTERNAL' | 'PUBLISHED';

/**
 * Metadata definition for a governance indicator.
 */
export interface GovernanceIndicatorDefinitionResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: IndicatorCategory;
  unit: IndicatorUnit;
  aggregationMethod: AggregationMethod;
  sourceDomain: string;
  calculationVersion: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Immutable point-in-time calculation snapshot for an indicator.
 */
export interface GovernanceIndicatorSnapshotResponse {
  id: string;
  indicatorDefinitionId: string;
  indicatorCode: string;
  indicatorName: string;
  category: IndicatorCategory;
  unit: IndicatorUnit;
  projectId: string | null;
  scopeType: GovernanceScopeType;
  state: string | null;
  district: string | null;
  tehsil: string | null;
  village: string | null;
  visibility: SnapshotVisibility;
  asOf: string;
  periodStart: string | null;
  periodEnd: string | null;
  numericValue: number;
  denominator: number | null;
  breakdownJson: string | null;
  calculationVersion: string;
  sourceDataTimestamp: string;
  sourceDataVersion: string | null;
  generatedById: string;
  generatedByName: string;
  generatedAt: string;
  evidenceCount: number;
}

/**
 * Statutory evidence linkage connecting a snapshot to research documents or citations.
 */
export interface GovernanceIndicatorEvidenceResponse {
  id: string;
  snapshotId: string;
  researchDocumentId: string | null;
  documentChunkId: string | null;
  documentTitle: string | null;
  documentType: string | null;
  chunkText: string | null;
  pageNumber: number | null;
  sectionTitle: string | null;
  evidenceType: GovernanceEvidenceType;
  similarityScore: number | null;
  rationale: string | null;
  linkedById: string;
  linkedByName: string;
  linkedAt: string;
}

/**
 * Payload to create an immutable audit snapshot.
 */
export interface CreateGovernanceSnapshotRequest {
  indicatorCode: string;
  scopeType: GovernanceScopeType;
  state?: string | null;
  district?: string | null;
  tehsil?: string | null;
  village?: string | null;
  projectId?: string | null;
  visibility?: SnapshotVisibility;
  asOf?: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  sourceDataVersion?: string;
}

/**
 * Payload to link statutory/circular evidence to a snapshot.
 */
export interface LinkGovernanceEvidenceRequest {
  researchDocumentId?: string;
  documentChunkId?: string;
  evidenceType: GovernanceEvidenceType;
  rationale?: string;
  similarityScore?: number;
}

/**
 * Query parameters for searching persisted snapshots by scope.
 */
export interface GovernanceSnapshotQueryParams {
  scopeType: GovernanceScopeType;
  state?: string;
  district?: string;
  tehsil?: string;
  village?: string;
  indicatorCode?: string;
}
