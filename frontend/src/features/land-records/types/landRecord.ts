export type LandUseType =
  | 'AGRICULTURAL'
  | 'RESIDENTIAL'
  | 'COMMERCIAL'
  | 'INDUSTRIAL'
  | 'GOVERNMENT'
  | 'FOREST'
  | 'OTHER';

export type OwnershipType =
  | 'INDIVIDUAL'
  | 'JOINT'
  | 'GOVERNMENT'
  | 'COMMUNITY'
  | 'OTHER';

export type LandRecordStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'DISPUTED'
  | 'PENDING_VERIFICATION';

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface GeoJsonMultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

export type GeoJsonGeometry = GeoJsonPolygon | GeoJsonMultiPolygon;

export interface LandRecord {
  id: string;
  parcelNumber: string;
  surveyNumber: string | null;
  state: string;
  district: string;
  tehsil: string;
  village: string;
  landAreaSqMeters: number;
  landUseType: LandUseType;
  ownershipType: OwnershipType;
  ownerName: string;
  ownerIdentifier: string | null;
  status: LandRecordStatus;
  boundary: GeoJsonGeometry;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLandRecordRequest {
  parcelNumber: string;
  surveyNumber?: string;
  state: string;
  district: string;
  tehsil: string;
  village: string;
  landAreaSqMeters: number;
  landUseType: LandUseType;
  ownershipType: OwnershipType;
  ownerName: string;
  ownerIdentifier?: string;
  status: LandRecordStatus;
  boundary: GeoJsonGeometry;
}

export interface UpdateLandRecordRequest {
  parcelNumber: string;
  surveyNumber?: string;
  state: string;
  district: string;
  tehsil: string;
  village: string;
  landAreaSqMeters: number;
  landUseType: LandUseType;
  ownershipType: OwnershipType;
  ownerName: string;
  ownerIdentifier?: string;
  status: LandRecordStatus;
  boundary: GeoJsonGeometry;
}

export interface SpatialQueryRequest {
  geometry: GeoJsonGeometry;
  status?: LandRecordStatus;
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

export interface LandRecordFilterParams {
  state?: string;
  district?: string;
  tehsil?: string;
  village?: string;
  parcelNumber?: string;
  landUseType?: string;
  status?: string;
  page?: number;
  size?: number;
}
