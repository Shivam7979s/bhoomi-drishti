/**
 * Phase 8 Policy Scenario & Simulation Domain Types
 * Strictly mirrors backend DTOs and database constraints from Phase 8A-8D.
 */

export type ScenarioType =
  | 'LAND_USE_CONVERSION'
  | 'LAND_CEILING_REDISTRIBUTION'
  | 'DISPUTE_RISK_ASSESSMENT'
  | 'CORRIDOR_BUFFER_INTERVENTION'
  | 'PROJECT_PARCEL_EVALUATION';

export type ScenarioStatus =
  | 'DRAFT'
  | 'RUNNING'
  | 'COMPLETED'
  | 'ARCHIVED';

export type EvidenceType =
  | 'STATUTORY_AUTHORITY'
  | 'DISPUTE_PRECEDENT'
  | 'ENVIRONMENTAL_BASELINE'
  | 'POLICY_GUIDELINE'
  | 'METHODOLOGICAL_REFERENCE';

export type LandUseType =
  | 'AGRICULTURAL'
  | 'RESIDENTIAL'
  | 'COMMERCIAL'
  | 'INDUSTRIAL'
  | 'GOVERNMENT'
  | 'FOREST'
  | 'OTHER';

export type OwnershipType =
  | 'INDIVIDUAL'
  | 'JOINT'
  | 'GOVERNMENT'
  | 'COMMUNITY'
  | 'OTHER';

export interface ScenarioParameter {
  id?: string;
  scenarioId?: string;
  targetState?: string | null;
  targetDistrict?: string | null;
  targetTehsil?: string | null;
  targetVillage?: string | null;
  interventionGeometryWkt?: string | null;
  sourceLandUse?: LandUseType | null;
  targetLandUse?: LandUseType | null;
  conversionPercentage?: number | null;
  maxOwnershipArea?: number | null;
  targetOwnershipType?: OwnershipType | null;
  bufferDistanceMeters?: number | null;
  customParametersJson?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScenarioResult {
  id: string;
  scenarioId: string;
  executedById?: string | null;
  executedByName?: string | null;
  executedAt: string;
  totalParcelsEvaluated: number;
  totalParcelsAffected: number;
  totalAreaAffectedSqm: number;
  baselineAreaSqm: number;
  simulatedAreaSqm: number;
  disputedParcelsCount: number;
  disputedAreaSqm: number;
  landUseDistributionJson?: string | null;
  ownershipDistributionJson?: string | null;
  spatialSummaryJson?: string | null;
}

export interface PolicyScenario {
  id: string;
  projectId: string;
  createdById?: string | null;
  createdByName?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  scenarioType: ScenarioType;
  status: ScenarioStatus;
  parameters: ScenarioParameter;
  latestResult?: ScenarioResult | null;
  evidenceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioEvidence {
  id: string;
  scenarioId: string;
  researchDocumentId: string;
  documentTitle: string;
  documentType: string;
  documentChunkId?: string | null;
  chunkText?: string | null;
  chunkPageNumber?: number | null;
  chunkSectionTitle?: string | null;
  evidenceType: EvidenceType;
  rationale?: string | null;
  similarityScore?: number | null;
  linkedById?: string | null;
  linkedByName?: string | null;
  linkedAt: string;
}

// Request Types

export interface ScenarioParameterRequest {
  targetState?: string;
  targetDistrict?: string;
  targetTehsil?: string;
  targetVillage?: string;
  interventionGeometryWkt?: string;
  sourceLandUse?: LandUseType;
  targetLandUse?: LandUseType;
  conversionPercentage?: number;
  maxOwnershipArea?: number;
  targetOwnershipType?: OwnershipType;
  bufferDistanceMeters?: number;
  customParametersJson?: string;
}

export interface CreatePolicyScenarioRequest {
  name: string;
  slug?: string;
  description?: string;
  scenarioType: ScenarioType;
  parameters?: ScenarioParameterRequest;
}

export interface UpdatePolicyScenarioRequest {
  name?: string;
  description?: string;
  status?: ScenarioStatus;
  parameters?: ScenarioParameterRequest;
}

export interface LinkScenarioEvidenceRequest {
  researchDocumentId: string;
  documentChunkId?: string;
  evidenceType: EvidenceType;
  rationale?: string;
  similarityScore?: number;
}

export interface ScenarioResultTarget {
  scenarioId: string;
  scenarioResultId?: string;
}

export interface CompareScenariosRequest {
  scenarioResults?: ScenarioResultTarget[];
  scenarioIds?: string[];
}

// Comparison Response Types

export interface ScenarioMetrics {
  totalParcelsEvaluated: number;
  totalParcelsAffected: number;
  totalAreaAffectedSqm: number;
  baselineAreaSqm: number;
  simulatedAreaSqm: number;
  disputedParcelsCount: number;
  disputedAreaSqm: number;
}

export interface DistributionItem {
  parcelCount: number;
  areaSqMeters: number;
  areaPercentage: number;
}

export interface ScenarioComparisonItem {
  scenarioId: string;
  scenarioName: string;
  scenarioType: ScenarioType;
  resultId: string;
  executedAt: string;
  metrics: ScenarioMetrics;
  landUseDistribution: Record<string, DistributionItem>;
  ownershipDistribution: Record<string, DistributionItem>;
  evidenceCount: number;
}

export interface MetricDeltas {
  totalParcelsEvaluated: number;
  totalParcelsAffected: number;
  totalAreaAffectedSqm: number;
  baselineAreaSqm: number;
  simulatedAreaSqm: number;
  disputedParcelsCount: number;
  disputedAreaSqm: number;
  affectedParcelsPercentagePointDelta?: number | null;
}

export interface DistributionDelta {
  category: string;
  leftParcelCount: number;
  rightParcelCount: number;
  parcelCountDelta: number;
  leftAreaSqm: number;
  rightAreaSqm: number;
  areaSqmDelta: number;
  leftAreaPercentage: number;
  rightAreaPercentage: number;
  areaPercentagePointDelta: number;
}

export interface PairwiseComparison {
  leftScenarioId: string;
  leftScenarioName: string;
  rightScenarioId: string;
  rightScenarioName: string;
  metricDeltas: MetricDeltas;
  landUseDistributionDeltas: DistributionDelta[];
  ownershipDistributionDeltas: DistributionDelta[];
}

export interface ScenarioComparisonResponse {
  scenarios: ScenarioComparisonItem[];
  comparisons: PairwiseComparison[];
}

// Spatial Summary Parsed Structure

export interface SpatialBoundingBox {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}

export interface SpatialSummary {
  scenarioType?: string;
  totalParcelsEvaluated?: number;
  totalParcelsAffected?: number;
  totalAreaAffectedSqm?: number;
  boundingBox?: SpatialBoundingBox;
}

export interface RawDistributionItem {
  parcelCount: number;
  areaSqMeters: number;
}
export type RawDistribution = Record<string, RawDistributionItem>;
