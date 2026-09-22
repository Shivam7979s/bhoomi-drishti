import { apiBaseUrl } from '../utils/env';

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Performs a GET request and parses the JSON response.
 *
 * The request is aborted after `timeoutMs` so an unreachable backend never leaves the
 * user interface hanging.
 */
export async function getJson<T>(path: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`GET ${path} failed with HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (cause: unknown) {
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      throw new Error(`GET ${path} timed out after ${timeoutMs} ms`);
    }
    throw cause instanceof Error ? cause : new Error(`GET ${path} failed`);
  } finally {
    window.clearTimeout(timeoutId);
  }
}
