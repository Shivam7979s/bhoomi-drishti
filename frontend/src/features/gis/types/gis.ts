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

export interface GeoJsonGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: any;
}

export interface ParcelProperties {
  parcelNumber: string;
  surveyNumber: string | null;
  state: string;
  district: string;
  tehsil: string;
  village: string;
  landAreaSqMeters: number;
  landUseType: LandUseType;
  ownershipType: OwnershipType;
  status: LandRecordStatus;
  ownerName: string | null;
  ownerIdentifier: string | null;
  linkedDocumentsCount: number;
}

export interface GeoJsonFeature {
  type: 'Feature';
  id: string;
  geometry: GeoJsonGeometry;
  properties: ParcelProperties;
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
  totalCount: number;
  returnedCount: number;
  truncated: boolean;
  zoomThresholdMet: boolean;
  metadata?: {
    limit?: number;
    bbox?: number[];
  };
}

export interface ParcelSummary {
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
  status: LandRecordStatus;
  ownerName: string | null;
  ownerIdentifier: string | null;
  bbox: number[]; // [minLon, minLat, maxLon, maxLat]
  linkedResearchDocumentsCount: number;
}

export interface GisFilterOptions {
  states: string[];
  districts: string[];
  tehsils: string[];
  villages: string[];
  landUseTypes: string[];
  ownershipTypes: string[];
  statuses: string[];
}

export interface GisFilterParams {
  bbox?: string;
  state?: string;
  district?: string;
  tehsil?: string;
  village?: string;
  landUseType?: string;
  ownershipType?: string;
  status?: string;
  limit?: number;
}
