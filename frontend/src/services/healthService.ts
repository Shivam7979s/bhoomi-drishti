import { getJson } from './apiClient';
import type { HealthResponse } from '../types/health';

/** Backend route that reports whether the Spring Boot API is reachable. */
export const HEALTH_ENDPOINT_PATH = '/api/health';

/** Calls the backend health endpoint. Throws when the backend is unreachable or answers with an error. */
export function fetchHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>(HEALTH_ENDPOINT_PATH);
}
