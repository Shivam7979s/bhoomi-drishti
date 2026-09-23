import { getJson, getJsonWithParams } from '../../../services/apiClient';
import type {
  GeoJsonFeatureCollection,
  GisFilterOptions,
  GisFilterParams,
  ParcelSummary,
} from '../types/gis';

export async function fetchLandRecordsGeoJson(
  params: GisFilterParams,
  signal?: AbortSignal,
): Promise<GeoJsonFeatureCollection> {
  const queryParams: Record<string, string | number | undefined> = {
    bbox: params.bbox,
    state: params.state,
    district: params.district,
    tehsil: params.tehsil,
    village: params.village,
    landUseType: params.landUseType,
    ownershipType: params.ownershipType,
    status: params.status,
    limit: params.limit || 500,
  };
  return getJsonWithParams<GeoJsonFeatureCollection>(
    '/api/gis/land-records',
    queryParams,
    15000,
    signal,
  );
}

export async function fetchParcelSummary(id: string): Promise<ParcelSummary> {
  return getJson<ParcelSummary>(`/api/gis/land-records/${id}/summary`, 10000);
}

export async function fetchGisFilterOptions(): Promise<GisFilterOptions> {
  return getJson<GisFilterOptions>('/api/gis/filters', 10000);
}
