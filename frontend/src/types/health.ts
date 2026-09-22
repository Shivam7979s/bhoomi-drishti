/** Shape of the response returned by the backend health endpoint. */
export interface HealthResponse {
  status: string;
  service: string;
}

/**
 * Connection state of the backend as seen from the browser.
 * `checking` is the initial state, before the first answer arrives.
 */
export type BackendStatus = 'checking' | 'connected' | 'offline';
