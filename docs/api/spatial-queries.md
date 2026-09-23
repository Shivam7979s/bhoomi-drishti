# Spatial Queries API (Phase 3 PostGIS)

Base URL: `http://localhost:8080`.

BHOOMI-DRISHTI provides true PostGIS spatial operations powered by PostgreSQL with the PostGIS 3.5 extension and a GiST spatial index on `land_records(boundary)`.

Spatial queries support both HTTP `POST` (with GeoJSON payload in the body) and HTTP `GET` (with stringified GeoJSON in query parameters).

## Coordinate Reference System & Geometry Specification

- **CRS / SRID**: EPSG:4326 (WGS 84).
- **Coordinate Order**: GeoJSON standard `[longitude, latitude]`. For Madhya Pradesh (e.g. Bhopal), coordinates are approximately `[77.41, 23.25]`.
- **Supported Geometries**: `Polygon` and `MultiPolygon`. Polygons must be topologically valid (outer ring closed, no self-intersections).

---

## 1. Spatial Intersects (`ST_Intersects`)

Finds all parcels whose boundaries intersect (touch or overlap) the specified query geometry.

### POST /api/land-records/spatial/intersects

#### Request Body (`com.bhoomidrishti.landrecord.dto.SpatialQueryRequest`)

```json
{
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [77.4000, 23.2400],
        [77.4300, 23.2400],
        [77.4300, 23.2700],
        [77.4000, 23.2700],
        [77.4000, 23.2400]
      ]
    ]
  },
  "status": "ACTIVE"
}
```

#### Query Parameters

- `page` (optional, default: `0`): Page number.
- `size` (optional, default: `20`, max: `100`): Results per page.

#### Response (200 OK)

Returns standard `PageResponse<LandRecordResponse>`.

```json
{
  "content": [
    {
      "id": "9d6558f0-aa89-4928-be6e-595a19a21a02",
      "parcelNumber": "MP-BHO-2026-LIVE-01",
      "state": "Madhya Pradesh",
      "district": "Bhopal",
      "boundary": {
        "type": "Polygon",
        "coordinates": [...]
      }
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true
}
```

---

## 2. Spatial Contains (`ST_Contains`)

Finds all parcels whose boundaries strictly contain the specified query geometry (`boundary ST_Contains query_geom`).

### POST /api/land-records/spatial/contains

#### Request Body

```json
{
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [77.4120, 23.2520],
        [77.4180, 23.2520],
        [77.4180, 23.2580],
        [77.4120, 23.2580],
        [77.4120, 23.2520]
      ]
    ]
  },
  "status": "ACTIVE"
}
```

#### Response (200 OK)

Returns standard `PageResponse<LandRecordResponse>` containing parcels that enclose the provided geometry.

---

## Error Handling

- `400 Bad Request`: If the input GeoJSON geometry is malformed, not closed, or self-intersecting.
  ```json
  {
    "error": "Boundary geometry is invalid: Self-intersection at or near point (77.41, 23.25)",
    "status": 400,
    "timestamp": "2026-09-23T09:20:00Z",
    "path": "/api/land-records/spatial/intersects"
  }
  ```
- `401 Unauthorized`: If request is unauthenticated.
