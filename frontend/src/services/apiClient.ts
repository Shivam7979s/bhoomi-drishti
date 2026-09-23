import { apiBaseUrl } from '../utils/env';

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Shape of the error body produced by the backend's `GlobalExceptionHandler`.
 * It never contains stack traces or internal details.
 */
export interface ApiErrorBody {
  timestamp?: string;
  status: number;
  error: string;
  message: string;
  path?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * A failed API request. `status` is the HTTP status code, or `null` when the backend could not be
 * reached at all (offline/timeout). `message` is always safe to display to the user.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly error: string | null = null,
    readonly fieldErrors: Record<string, string> | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * Shared fetch wrapper: JSON only, explicit timeout, `credentials: 'include'` so the HttpOnly
 * session cookie travels with every request, and backend error bodies mapped to {@link ApiError}.
 */
async function apiRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const { method, body, timeoutMs = DEFAULT_TIMEOUT_MS, signal } = options;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw await toApiError(response, path);
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  } catch (cause: unknown) {
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      throw new ApiError(`${method} ${path} timed out after ${timeoutMs} ms`, null);
    }
    if (cause instanceof ApiError) throw cause;
    if (cause instanceof SyntaxError) {
      // 2xx response without a JSON body - return nothing rather than crashing the caller.
      return undefined as T;
    }
    throw new ApiError(cause instanceof Error ? cause.message : `${method} ${path} failed`, null);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function toApiError(response: Response, path: string): Promise<ApiError> {
  const fallback = `${path} failed with HTTP ${response.status}`;
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    return new ApiError(body.message || fallback, response.status, body.error ?? null, body.fieldErrors ?? null);
  } catch {
    return new ApiError(fallback, response.status, null);
  }
}

/** Performs a GET request and parses the JSON response (aborted after `timeoutMs`). */
export function getJson<T>(path: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<T> {
  return apiRequest<T>(path, { method: 'GET', timeoutMs });
}

/** Sends a JSON POST body and parses the JSON response (aborted after `timeoutMs`). */
export function postJson<T>(path: string, body?: unknown, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', body, timeoutMs });
}

/** Sends a JSON PUT body and parses the JSON response (aborted after `timeoutMs`). */
export function putJson<T>(path: string, body?: unknown, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<T> {
  return apiRequest<T>(path, { method: 'PUT', body, timeoutMs });
}

/** Sends a DELETE request and parses the JSON response (aborted after `timeoutMs`). */
export function deleteJson<T>(path: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE', timeoutMs });
}

/** GET with query-string construction from a record of params. */
export function getJsonWithParams<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  signal?: AbortSignal,
): Promise<T> {
  const qp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qp.append(k, String(v));
  }
  const qs = qp.toString();
  const full = qs ? `${path}?${qs}` : path;
  return apiRequest<T>(full, { method: 'GET', timeoutMs, signal });
}
