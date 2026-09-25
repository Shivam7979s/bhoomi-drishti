import type { EvidenceItem } from '../../knowledge/types/knowledge';

/**
 * Categorical grounding status communicated by the Phase 10.2 backend.
 * Represents evidence support without uncalibrated statistical confidence scores.
 */
export type GroundingStatus =
  | 'GROUNDED'
  | 'WEAK_EVIDENCE'
  | 'NO_EVIDENCE'
  | 'FALLBACK';

/**
 * Request payload sent to POST /api/ai/assistant/query.
 * Clients cannot select model, provider, prompts, or similarity thresholds.
 */
export interface AssistantQueryRequestDTO {
  query: string;
  topK?: number;
  documentType?: string;
  organization?: string;
}

/**
 * Authoritative citation metadata bound directly to a retrieved PostgreSQL document chunk.
 * Citation metadata is strictly backend-owned.
 */
export interface CitationDTO {
  citationIndex: number;
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  pageNumber: number | null;
  sectionTitle: string | null;
  authors: string | null;
  organization: string | null;
  publicationDate: string | null;
  sourceUrl: string | null;
  similarity: number;
  formattedCitation: string;
  quote: string;
}

/**
 * Technical retrieval and execution diagnostics returned by the backend.
 * Kept secondary/audit-focused; never displayed as confidence.
 */
export interface AssistantRetrievalMetadata {
  retrievalDurationMs?: number;
  synthesisDurationMs?: number;
  totalDurationMs?: number;
  providerUsed?: string;
  citationCount?: number;
  [key: string]: unknown;
}

/**
 * Structured evidence-grounded response returned by POST /api/ai/assistant/query.
 */
export interface AssistantQueryResponseDTO {
  query: string;
  answer: string;
  groundingStatus: GroundingStatus;
  citations: CitationDTO[];
  disclaimer: string;
  retrievalMetadata?: AssistantRetrievalMetadata;
}

/**
 * Adapter converting backend CitationDTO to the existing EvidenceItem shape
 * for seamless reuse of EvidenceDetailsModal without code duplication.
 */
export function citationToEvidenceItem(citation: CitationDTO): EvidenceItem {
  return {
    chunkId: citation.chunkId,
    documentId: citation.documentId,
    documentTitle: citation.documentTitle,
    documentType: citation.documentType,
    authors: citation.authors ?? undefined,
    organization: citation.organization ?? undefined,
    publicationDate: citation.publicationDate ?? undefined,
    text: citation.quote ?? '',
    pageNumber: citation.pageNumber ?? undefined,
    sectionTitle: citation.sectionTitle ?? undefined,
    similarity: citation.similarity,
    sourceUrl: citation.sourceUrl ?? undefined,
    citation: citation.formattedCitation ?? '',
    linkedLandRecordsCount: 0,
  };
}
