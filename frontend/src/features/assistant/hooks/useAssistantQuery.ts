import { useState, useCallback, useRef } from 'react';
import type {
  AssistantQueryRequestDTO,
  AssistantQueryResponseDTO,
} from '../types/assistant';
import { queryAssistant } from '../services/assistantService';

export interface UseAssistantQueryResult {
  data: AssistantQueryResponseDTO | null;
  isLoading: boolean;
  error: string | null;
  lastRequest: AssistantQueryRequestDTO | null;
  executeQuery: (request: AssistantQueryRequestDTO) => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook managing execution state, race-condition safety, and error handling
 * for evidence-grounded AI assistant queries.
 */
export function useAssistantQuery(): UseAssistantQueryResult {
  const [data, setData] = useState<AssistantQueryResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<AssistantQueryRequestDTO | null>(null);

  // Guards against race conditions if multiple requests are submitted in flight
  const activeRequestIdRef = useRef<number>(0);

  const executeQuery = useCallback(async (request: AssistantQueryRequestDTO) => {
    const trimmedQuery = request.query.trim();
    if (!trimmedQuery) return;

    const currentRequestId = ++activeRequestIdRef.current;
    setIsLoading(true);
    setError(null);
    setLastRequest(request);

    try {
      const response = await queryAssistant({
        ...request,
        query: trimmedQuery,
      });

      // Discard stale responses if a newer request was dispatched
      if (currentRequestId === activeRequestIdRef.current) {
        setData(response);
      }
    } catch (err: unknown) {
      if (currentRequestId === activeRequestIdRef.current) {
        const message =
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while querying the AI assistant.';
        setError(message);
        setData(null);
      }
    } finally {
      if (currentRequestId === activeRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    activeRequestIdRef.current++;
    setData(null);
    setError(null);
    setIsLoading(false);
    setLastRequest(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    lastRequest,
    executeQuery,
    reset,
  };
}
