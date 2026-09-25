import { postJson, ApiError } from '../../../services/apiClient';
import type {
  AssistantQueryRequestDTO,
  AssistantQueryResponseDTO,
} from '../types/assistant';

/**
 * Assistant requests require up to 35 seconds to allow for deep semantic retrieval,
 * evidence threshold gating, and model synthesis via the AI service.
 */
const ASSISTANT_TIMEOUT_MS = 35000;

/**
 * Sends an evidence-grounded statutory query to the backend assistant endpoint.
 *
 * @param request Query payload with optional metadata filters
 * @returns Grounded response with citations and grounding status
 */
export async function queryAssistant(
  request: AssistantQueryRequestDTO,
): Promise<AssistantQueryResponseDTO> {
  try {
    return await postJson<AssistantQueryResponseDTO>(
      '/api/ai/assistant/query',
      request,
      ASSISTANT_TIMEOUT_MS,
    );
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      if (err.status === 400) {
        throw new Error(err.message || 'Please provide a valid question between 2 and 500 characters.');
      }
      if (err.status === 401 || err.status === 403) {
        throw new Error('You do not have permission to access one or more requested document types.');
      }
      if (err.status === 503) {
        throw new Error(
          'The statutory AI knowledge service is temporarily unavailable. Please retry shortly.',
        );
      }
      if (err.status === null && err.message.includes('timed out')) {
        throw new Error(
          'Evidence retrieval and synthesis timed out after 35 seconds. Please try a more specific question.',
        );
      }
    }
    throw err;
  }
}
