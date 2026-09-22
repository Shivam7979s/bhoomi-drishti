import { useCallback, useEffect, useState } from 'react';
import { fetchHealth } from '../services/healthService';
import type { BackendStatus, HealthResponse } from '../types/health';

export interface BackendHealth {
  status: BackendStatus;
  health: HealthResponse | null;
  error: string | null;
  lastCheckedAt: Date | null;
  /** Runs the health check again (used by the "Check again" button). */
  refresh: () => void;
}

/**
 * Checks the backend health endpoint once on mount and exposes the result.
 * A failing request is turned into the `offline` state instead of an exception,
 * so the application keeps working when the backend is not running.
 */
export function useBackendHealth(): BackendHealth {
  const [status, setStatus] = useState<BackendStatus>('checking');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCurrentAttempt = true;

    setStatus('checking');
    setError(null);

    fetchHealth()
      .then((response) => {
        if (!isCurrentAttempt) {
          return;
        }
        setHealth(response);
        setStatus('connected');
      })
      .catch((cause: unknown) => {
        if (!isCurrentAttempt) {
          return;
        }
        setHealth(null);
        setStatus('offline');
        setError(cause instanceof Error ? cause.message : 'The backend could not be reached.');
      })
      .finally(() => {
        if (isCurrentAttempt) {
          setLastCheckedAt(new Date());
        }
      });

    return () => {
      isCurrentAttempt = false;
    };
  }, [attempt]);

  const refresh = useCallback(() => setAttempt((previous) => previous + 1), []);

  return { status, health, error, lastCheckedAt, refresh };
}
