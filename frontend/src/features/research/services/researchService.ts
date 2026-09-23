import {
  deleteJson,
  getJson,
  getJsonWithParams,
  postJson,
  putJson,
} from '../../../services/apiClient';
import type { LandRecord } from '../../land-records/types/landRecord';
import type {
  CreateResearchDocumentRequest,
  PageResponse,
  ResearchDocument,
  ResearchFilterParams,
  UpdateResearchDocumentRequest,
} from '../types/research';

const BASE_PATH = '/api/research-documents';

export async function listResearchDocuments(
  params: ResearchFilterParams = {},
): Promise<PageResponse<ResearchDocument>> {
  return getJsonWithParams<PageResponse<ResearchDocument>>(BASE_PATH, {
    title: params.title,
    documentType: params.documentType,
    status: params.status,
    organization: params.organization,
    author: params.author,
    language: params.language,
    startDate: params.startDate,
    endDate: params.endDate,
    search: params.search,
    page: params.page ?? 0,
    size: params.size ?? 20,
  });
}

export async function getResearchDocumentById(id: string): Promise<ResearchDocument> {
  return getJson<ResearchDocument>(`${BASE_PATH}/${id}`);
}

export async function createResearchDocument(
  payload: CreateResearchDocumentRequest,
): Promise<ResearchDocument> {
  return postJson<ResearchDocument>(BASE_PATH, payload);
}

export async function updateResearchDocument(
  id: string,
  payload: UpdateResearchDocumentRequest,
): Promise<ResearchDocument> {
  return putJson<ResearchDocument>(`${BASE_PATH}/${id}`, payload);
}

export async function deleteResearchDocument(id: string): Promise<void> {
  return deleteJson<void>(`${BASE_PATH}/${id}`);
}

export async function linkLandRecord(
  documentId: string,
  landRecordId: string,
): Promise<ResearchDocument> {
  return postJson<ResearchDocument>(`${BASE_PATH}/${documentId}/land-records/${landRecordId}`);
}

export async function unlinkLandRecord(
  documentId: string,
  landRecordId: string,
): Promise<ResearchDocument> {
  return deleteJson<ResearchDocument>(`${BASE_PATH}/${documentId}/land-records/${landRecordId}`);
}

export async function getLinkedLandRecords(documentId: string): Promise<LandRecord[]> {
  return getJson<LandRecord[]>(`${BASE_PATH}/${documentId}/land-records`);
}

export async function getLinkedResearchDocuments(
  landRecordId: string,
  page: number = 0,
  size: number = 20,
): Promise<PageResponse<ResearchDocument>> {
  return getJsonWithParams<PageResponse<ResearchDocument>>(
    `/api/land-records/${landRecordId}/research-documents`,
    { page, size },
  );
}
