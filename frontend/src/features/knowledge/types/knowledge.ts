export interface EvidenceItem {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  authors?: string;
  organization?: string;
  publicationDate?: string;
  text: string;
  pageNumber?: number;
  sectionTitle?: string;
  similarity: number;
  sourceUrl?: string;
  citation?: string;
  linkedLandRecordsCount: number;
}

export interface KnowledgeSearchRequest {
  query: string;
  topK?: number;
  documentType?: string;
  organization?: string;
}

export interface KnowledgeSearchResponse {
  query: string;
  totalResults: number;
  searchDurationMs: number;
  results: EvidenceItem[];
}

export type ProcessingStatusType =
  | 'NOT_INGESTED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export interface DocumentProcessingStatus {
  id?: string;
  researchDocumentId: string;
  status: ProcessingStatusType;
  errorMessage?: string;
  chunkCount: number;
  contentHash?: string;
  processingVersion: string;
  startedAt?: string;
  completedAt?: string;
}

export interface IngestDocumentResponse {
  documentId: string;
  status: ProcessingStatusType;
  message: string;
}
