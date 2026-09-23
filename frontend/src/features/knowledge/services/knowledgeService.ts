import { getJson, postJson } from '../../../services/apiClient';
import type {
  DocumentProcessingStatus,
  IngestDocumentResponse,
  KnowledgeSearchRequest,
  KnowledgeSearchResponse,
} from '../types/knowledge';

export async function searchKnowledge(
  request: KnowledgeSearchRequest,
): Promise<KnowledgeSearchResponse> {
  return postJson<KnowledgeSearchResponse>('/api/knowledge/search', request);
}

export async function triggerIngest(
  documentId: string,
): Promise<IngestDocumentResponse> {
  return postJson<IngestDocumentResponse>(
    `/api/research-documents/${documentId}/ingest`,
    {},
  );
}

export async function getProcessingStatus(
  documentId: string,
): Promise<DocumentProcessingStatus> {
  return getJson<DocumentProcessingStatus>(
    `/api/research-documents/${documentId}/processing-status`,
  );
}
