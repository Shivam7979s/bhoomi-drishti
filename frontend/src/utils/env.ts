/**
 * Frontend configuration read from Vite environment variables.
 *
 * The values come from the repository root `.env` file (`envDir` in vite.config.ts);
 * copy `.env.example` to `.env` to change them. Only variables prefixed with `VITE_`
 * are exposed to the browser.
 */
const DEFAULT_API_BASE_URL = 'http://localhost:8080';

/** Base URL of the backend API, for example `http://localhost:8080` (no trailing slash). */
export const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

function normalizeApiBaseUrl(configuredValue: string | undefined): string {
  const trimmed = configuredValue?.trim();
  return trimmed ? trimmed.replace(/\/+$/, '') : DEFAULT_API_BASE_URL;
}
