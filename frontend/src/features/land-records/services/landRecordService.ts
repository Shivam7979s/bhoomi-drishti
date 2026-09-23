import {
  deleteJson,
  getJson,
  getJsonWithParams,
  postJson,
  putJson,
} from '../../../services/apiClient';
import type {
  CreateLandRecordRequest,
  LandRecord,
  LandRecordFilterParams,
  PageResponse,
  SpatialQueryRequest,
  UpdateLandRecordRequest,
} from '../types/landRecord';

const BASE_PATH = '/api/land-records';

export async function listLandRecords(
  params: LandRecordFilterParams = {},
): Promise<PageResponse<LandRecord>> {
  return getJsonWithParams<PageResponse<LandRecord>>(BASE_PATH, {
    state: params.state,
    district: params.district,
    tehsil: params.tehsil,
    village: params.village,
    parcelNumber: params.parcelNumber,
    landUseType: params.landUseType,
    status: params.status,
    page: params.page ?? 0,
    size: params.size ?? 20,
  });
}

export async function getLandRecordById(id: string): Promise<LandRecord> {
  return getJson<LandRecord>(`${BASE_PATH}/${id}`);
}

export async function createLandRecord(
  payload: CreateLandRecordRequest,
): Promise<LandRecord> {
  return postJson<LandRecord>(BASE_PATH, payload);
}

export async function updateLandRecord(
  id: string,
  payload: UpdateLandRecordRequest,
): Promise<LandRecord> {
  return putJson<LandRecord>(`${BASE_PATH}/${id}`, payload);
}

export async function deleteLandRecord(id: string): Promise<void> {
  return deleteJson<void>(`${BASE_PATH}/${id}`);
}

export async function searchSpatialIntersects(
  payload: SpatialQueryRequest,
  page: number = 0,
  size: number = 20,
): Promise<PageResponse<LandRecord>> {
  return postJson<PageResponse<LandRecord>>(
    `${BASE_PATH}/spatial/intersects?page=${page}&size=${size}`,
    payload,
  );
}

export async function searchSpatialContains(
  payload: SpatialQueryRequest,
  page: number = 0,
  size: number = 20,
): Promise<PageResponse<LandRecord>> {
  return postJson<PageResponse<LandRecord>>(
    `${BASE_PATH}/spatial/contains?page=${page}&size=${size}`,
    payload,
  );
}
