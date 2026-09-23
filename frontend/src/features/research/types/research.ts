export type DocumentType =
  | 'RESEARCH_PAPER'
  | 'POLICY_DOCUMENT'
  | 'GOVERNMENT_REPORT'
  | 'ACADEMIC_PUBLICATION'
  | 'DATASET'
  | 'CASE_STUDY'
  | 'LEGAL_DOCUMENT'
  | 'OTHER';

export type ResearchDocumentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface LinkedLandRecordSummary {
  id: string;
  parcelNumber: string;
  state: string;
  district: string;
  tehsil: string;
  village: string;
  landUseType?: string | null;
  status?: string | null;
}

export interface ResearchDocument {
  id: string;
  title: string;
  description: string;
  documentType: DocumentType;
  authors: string;
  organization?: string | null;
  publicationDate?: string | null;
  sourceUrl?: string | null;
  fileUrl?: string | null;
  language: string;
  keywords?: string | null;
  abstractText?: string | null;
  status: ResearchDocumentStatus;
  createdById?: string | null;
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string;
  linkedLandRecordCount: number;
  linkedLandRecords?: LinkedLandRecordSummary[];
}

export interface CreateResearchDocumentRequest {
  title: string;
  description: string;
  documentType: DocumentType;
  authors: string;
  organization?: string;
  publicationDate?: string;
  sourceUrl?: string;
  fileUrl?: string;
  language?: string;
  keywords?: string;
  abstractText?: string;
  status?: ResearchDocumentStatus;
  linkedLandRecordIds?: string[];
}

export interface UpdateResearchDocumentRequest {
  title: string;
  description: string;
  documentType: DocumentType;
  authors: string;
  organization?: string;
  publicationDate?: string;
  sourceUrl?: string;
  fileUrl?: string;
  language?: string;
  keywords?: string;
  abstractText?: string;
  status: ResearchDocumentStatus;
}

export interface ResearchFilterParams {
  title?: string;
  documentType?: string;
  status?: string;
  organization?: string;
  author?: string;
  language?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
