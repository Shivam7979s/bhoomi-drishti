# GIS & Geospatial Intelligence API

Phase 6 introduces high-performance PostGIS-backed spatial viewport querying, cadastral boundary GeoJSON serialization, dynamic spatial filtering, strict data privacy projections, and Research Hub/AI Evidence integrations.

---

## 1. Overview & Architecture

- **PostGIS SRID**: 4326 (WGS 84).
- **Index Utilized**: `idx_land_records_boundary ON land_records USING GIST (boundary)` (created in V2).
- **Envelope Intersection**: Utilizes `ST_Intersects(lr.boundary, ST_MakeEnvelope(:minLon, :minLat, :maxLon, :maxLat, 4326))`.
- **Payload Limits**: Max 500 features returned per viewport query (`limit` parameter clamped between 1 and 500). Max bounding box area is guarded at 4.0 square degrees to prevent denial-of-service / memory exhaustion.
- **Privacy Model**:
  - `CITIZEN` / `UNAUTHENTICATED`: `ownerName = null`, `ownerIdentifier = null`. Only `ACTIVE` parcels are returned.
  - `RESEARCHER` / `ACADEMIA`: `ownerName = null`, `ownerIdentifier = null`. No PII exposed.
  - `GOVERNMENT_OFFICIAL` / `ADMIN`: Unmasked owner personal information returned (`ownerName`, `ownerIdentifier`).

---

## 2. Endpoints

### 2.1 Get Land Records GeoJSON FeatureCollection

`GET /api/gis/land-records`

Retrieves GeoJSON cadastral features intersecting the specified viewport bounding box and matching optional administrative/attribute filters.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bbox` | String | Conditional | Comma-delimited `minLon,minLat,maxLon,maxLat` in WGS 84 degrees. |
| `minLon`, `minLat`, `maxLon`, `maxLat` | Double | Conditional | Alternative discrete parameters if `bbox` is omitted. |
| `state` | String | Optional | Filter by State name. |
| `district` | String | Optional | Filter by District name. |
| `tehsil` | String | Optional | Filter by Tehsil name. |
| `village` | String | Optional | Filter by Village name. |
| `landUseType` | String | Optional | Filter by land use category (`AGRICULTURAL`, `RESIDENTIAL`, `COMMERCIAL`, `INDUSTRIAL`, `GOVERNMENT`, `FOREST`, `OTHER`). |
| `ownershipType` | String | Optional | Filter by ownership structure (`INDIVIDUAL`, `JOINT`, `GOVERNMENT`, `COMMUNITY`, `OTHER`). |
| `status` | String | Optional | Filter by status (`ACTIVE`, `INACTIVE`, `DISPUTED`, `PENDING_VERIFICATION`). Public users are always constrained to `ACTIVE`. |
| `limit` | Integer | Optional | Max features to return (Default: 100, Maximum: 500). |

#### Response Schema (GeoJSON FeatureCollection)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "1803d36b-67e9-4e78-be7f-a63e26c6d0fb",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [77.412, 23.251],
            [77.415, 23.251],
            [77.415, 23.255],
            [77.412, 23.255],
            [77.412, 23.251]
          ]
        ]
      },
      "properties": {
        "parcelNumber": "MP-BHO-2026-LIVE-01",
        "surveyNumber": "SN-99/1",
        "state": "Madhya Pradesh",
        "district": "Bhopal",
        "tehsil": "Huzur",
        "village": "Kolar",
        "landAreaSqMeters": 6500.0,
        "landUseType": "AGRICULTURAL",
        "ownershipType": "INDIVIDUAL",
        "status": "ACTIVE",
        "ownerName": null,
        "ownerIdentifier": null,
        "linkedDocumentsCount": 0
      }
    }
  ],
  "totalCount": 1,
  "returnedCount": 1,
  "truncated": false,
  "zoomThresholdMet": true,
  "metadata": {
    "limit": 500,
    "bbox": [77.0, 23.0, 77.5, 23.5]
  }
}
```

---

### 2.2 Get Parcel Summary & Geometry Bounds

`GET /api/gis/land-records/{id}/summary`

Provides a lightweight summary of a parcel including bounding box extent and linked research document count.

#### Path Variables
| Variable | Type | Description |
|----------|------|-------------|
| `id` | UUID | Unique identifier of the land record. |

#### Response Schema
```json
{
  "id": "1803d36b-67e9-4e78-be7f-a63e26c6d0fb",
  "parcelNumber": "MP-BHO-2026-LIVE-01",
  "surveyNumber": "SN-99/1",
  "state": "Madhya Pradesh",
  "district": "Bhopal",
  "tehsil": "Huzur",
  "village": "Kolar",
  "landAreaSqMeters": 6500.0,
  "landUseType": "AGRICULTURAL",
  "ownershipType": "INDIVIDUAL",
  "status": "ACTIVE",
  "ownerName": null,
  "ownerIdentifier": null,
  "bbox": [77.41, 23.25, 77.42, 23.26],
  "linkedResearchDocumentsCount": 0
}
```

---

### 2.3 Get GIS Filter Options

`GET /api/gis/filters`

Returns distinct dropdown values currently present in the database to populate the frontend spatial filter panel.

#### Response Schema
```json
{
  "states": ["Madhya Pradesh"],
  "districts": ["Bhopal", "Indore"],
  "tehsils": ["Huzur", "Sanwer"],
  "villages": ["Kolar", "Manglia"],
  "landUseTypes": ["AGRICULTURAL", "RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "GOVERNMENT", "FOREST", "OTHER"],
  "ownershipTypes": ["INDIVIDUAL", "JOINT", "GOVERNMENT", "COMMUNITY", "OTHER"],
  "statuses": ["ACTIVE", "INACTIVE", "DISPUTED", "PENDING_VERIFICATION"]
}
```

---

## 3. Base Map Configuration & Production Direction

- **Development Base Map**: Configured by default to OpenStreetMap standard tiles (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
- **Configurability**: Environment variable `VITE_MAP_TILE_URL` and `VITE_MAP_TILE_ATTRIBUTION` allow swapping tile providers without code changes.
- **Production Direction**: Public raster tile services are intended solely for development, testing, and Hackathon demonstration. Self-hosted vector tile servers (e.g., Tegola / Martin / MapLibre) or official Bhuvan/NIC tile services represent the long-term production deployment path.
