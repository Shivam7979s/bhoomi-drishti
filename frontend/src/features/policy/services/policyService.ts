import { deleteJson, getJson, getJsonWithParams, postJson, putJson } from '../../../services/apiClient';
import type { KnowledgeSearchRequest, KnowledgeSearchResponse } from '../../knowledge/types/knowledge';
import type {
  CompareScenariosRequest,
  CreatePolicyScenarioRequest,
  LinkScenarioEvidenceRequest,
  PolicyScenario,
  ScenarioComparisonResponse,
  ScenarioEvidence,
  ScenarioResult,
  UpdatePolicyScenarioRequest,
} from '../types/policy';

export interface PagedPolicyScenarios {
  content: PolicyScenario[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/**
 * Lists scenarios belonging to a project with pagination.
 */
export async function listProjectScenarios(
  projectId: string,
  page: number = 0,
  size: number = 20,
): Promise<PagedPolicyScenarios> {
  return getJsonWithParams<PagedPolicyScenarios>(
    `/api/projects/${projectId}/scenarios`,
    { page, size },
  );
}

/**
 * Creates a new policy scenario attached to a project.
 */
export async function createScenario(
  projectId: string,
  request: CreatePolicyScenarioRequest,
): Promise<PolicyScenario> {
  return postJson<PolicyScenario>(`/api/projects/${projectId}/scenarios`, request);
}

/**
 * Retrieves a single scenario by ID.
 */
export async function getScenario(scenarioId: string): Promise<PolicyScenario> {
  return getJson<PolicyScenario>(`/api/scenarios/${scenarioId}`);
}

/**
 * Updates an existing scenario's metadata or parameters.
 * Note: Modifying parameters on a COMPLETED scenario transitions it back to DRAFT.
 */
export async function updateScenario(
  scenarioId: string,
  request: UpdatePolicyScenarioRequest,
): Promise<PolicyScenario> {
  return putJson<PolicyScenario>(`/api/scenarios/${scenarioId}`, request);
}

/**
 * Deletes a scenario. Only DRAFT scenarios without results can be deleted.
 */
export async function deleteScenario(scenarioId: string): Promise<void> {
  return deleteJson<void>(`/api/scenarios/${scenarioId}`);
}

/**
 * Executes deterministic PostGIS policy simulation for a scenario (Phase 8B engine).
 * Produces and persists a new ScenarioResult snapshot.
 */
export async function runScenario(scenarioId: string): Promise<ScenarioResult> {
  return postJson<ScenarioResult>(`/api/scenarios/${scenarioId}/run`, {}, 30000);
}

/**
 * Retrieves all historical simulation result snapshots for a scenario, newest first.
 */
export async function getScenarioResults(scenarioId: string): Promise<ScenarioResult[]> {
  return getJson<ScenarioResult[]>(`/api/scenarios/${scenarioId}/results`);
}

/**
 * Retrieves all evidence items linked to a scenario.
 */
export async function getScenarioEvidence(scenarioId: string): Promise<ScenarioEvidence[]> {
  return getJson<ScenarioEvidence[]>(`/api/scenarios/${scenarioId}/evidence`);
}

/**
 * Links a research document or specific chunk as evidence to a scenario.
 */
export async function linkEvidence(
  scenarioId: string,
  request: LinkScenarioEvidenceRequest,
): Promise<ScenarioEvidence> {
  return postJson<ScenarioEvidence>(`/api/scenarios/${scenarioId}/evidence`, request);
}

/**
 * Unlinks an evidence item from a scenario.
 */
export async function unlinkEvidence(
  scenarioId: string,
  evidenceId: string,
): Promise<void> {
  return deleteJson<void>(`/api/scenarios/${scenarioId}/evidence/${evidenceId}`);
}

/**
 * Searches the research knowledge base for candidate evidence items for a scenario.
 * Does not persist evidence.
 */
export async function searchEvidenceCandidates(
  scenarioId: string,
  request: KnowledgeSearchRequest,
): Promise<KnowledgeSearchResponse> {
  return postJson<KnowledgeSearchResponse>(
    `/api/scenarios/${scenarioId}/evidence/search`,
    request,
    15000,
  );
}

/**
 * Compares 2 to 10 scenario results side-by-side with pairwise delta analysis.
 * Purely descriptive.
 */
export async function compareScenarios(
  request: CompareScenariosRequest,
): Promise<ScenarioComparisonResponse> {
  return postJson<ScenarioComparisonResponse>('/api/policy/compare', request, 20000);
}
