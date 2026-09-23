# Land Records API (Phase 3)

Base URL (local development): `http://localhost:8080`.

All endpoints require authentication (Session cookie or `Authorization: Bearer <jwt>`). Error responses match the standard error shape: `{ "error": "...", "status": ..., "timestamp": "...", "path": "...", "fieldErrors": [...] }`.

## RBAC Matrix

| Role | Read (List & Details) | Create | Update | Delete | Spatial Queries |
|---|---|---|---|---|---|
| **PUBLIC** | Active records only | ❌ 403 | ❌ 403 | ❌ 403 | Active records |
| **RESEARCHER** | All records | ❌ 403 | ❌ 403 | ❌ 403 | All records |
| **ACADEMIA** | All records | ❌ 403 | ❌ 403 | ❌ 403 | All records |
| **GOVERNMENT_OFFICIAL** | All records | ✅ 201 | ✅ 200 | ❌ 403 | All records |
| **ADMIN** | All records | ✅ 201 | ✅ 200 | ✅ 204 | All records |

---

## GET /api/land-records

List and filter land records with server-side pagination.

### Query Parameters

- `page` (optional, default: `0`): Zero-based page number.
- `size` (optional, default: `20`, max: `100`): Page size.
- `state` (optional): Filter by exact state name.
- `district` (optional): Filter by exact district name.
- `tehsil` (optional): Filter by exact tehsil name.
- `village` (optional): Filter by exact village name.
- `parcelNumber` (optional): Case-insensitive substring match on parcel number.
- `landUseType` (optional): `AGRICULTURAL`, `RESIDENTIAL`, `COMMERCIAL`, `INDUSTRIAL`, `FOREST`, `WATER_BODY`, `GOVERNMENT`, `MIXED`.
- `status` (optional): `ACTIVE`, `DISPUTED`, `PENDING_VERIFICATION`, `ARCHIVED`. (Ignored for `PUBLIC` callers; public callers only see `ACTIVE`).

### Response (200 OK)

```json
{
  "content": [
    {
      "id": "9d6558f0-aa89-4928-be6e-595a19a21a02",
      "parcelNumber": "MP-BHO-2026-001",
      "surveyNumber": "SN-8821/A",
      "state": "Madhya Pradesh",
      "district": "Bhopal",
      "tehsil": "Huzur",
      "village": "Kolar",
      "landAreaSqMeters": 12500.50,
      "landUseType": "AGRICULTURAL",
      "ownershipType": "INDIVIDUAL",
      "ownerName": "Shivam Patel",
      "ownerIdentifier": "IND-MP-99482",
      "status": "ACTIVE",
      "boundary": {
        "type": "Polygon",
        "coordinates": [
          [
            [77.4100, 23.2500],
            [77.4200, 23.2500],
            [77.4200, 23.2600],
            [77.4100, 23.2600],
            [77.4100, 23.2500]
          ]
        ]
      },
      "createdAt": "2026-09-23T09:15:00Z",
      "updatedAt": "2026-09-23T09:15:00Z"
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

## GET /api/land-records/{id}

Retrieve a single land record by UUID.

- `200 OK` → The `LandRecordResponse` object.
- `401 Unauthorized` → Caller is not logged in.
- `404 Not Found` → Record does not exist, or caller is `PUBLIC` and record status is not `ACTIVE`.

---

## POST /api/land-records

Create a new land record. Restricted to `GOVERNMENT_OFFICIAL` and `ADMIN`.

### Request Body

```json
{
  "parcelNumber": "MP-BHO-2026-002",
  "surveyNumber": "SN-8822/B",
  "state": "Madhya Pradesh",
  "district": "Bhopal",
  "tehsil": "Huzur",
  "village": "Bairagarh",
  "landAreaSqMeters": 5400.00,
  "landUseType": "RESIDENTIAL",
  "ownershipType": "INDIVIDUAL",
  "ownerName": "Aarav Sharma",
  "ownerIdentifier": "IND-MP-11234",
  "status": "ACTIVE",
  "boundary": {
    "type": "Polygon",
    "coordinates": [
      [
        [77.3500, 23.2800],
        [77.3600, 23.2800],
        [77.3600, 23.2900],
        [77.3500, 23.2900],
        [77.3500, 23.2800]
      ]
    ]
  }
}
```

### Validation Rules

- `parcelNumber`: Required, 1–64 characters, unique.
- `state`, `district`, `tehsil`, `village`: Required, 1–100 characters.
- `landAreaSqMeters`: Required, positive decimal (`BigDecimal`).
- `landUseType`: Required enum.
- `ownershipType`: Required enum (`INDIVIDUAL`, `JOINT`, `GOVERNMENT`, `COMMUNITY`, `CORPORATE`).
- `ownerName`: Required when `ownershipType != GOVERNMENT`.
- `boundary`: Required GeoJSON `Polygon` or `MultiPolygon`. Coordinates must be WGS-84 (`SRID 4326`, `[longitude, latitude]`). The polygon must be topologically valid (closed, non-self-intersecting).

### Responses

- `201 Created` → Created record with generated UUID and timestamps.
- `400 Bad Request` → Validation error or invalid geometry.
- `403 Forbidden` → Insufficient permissions (e.g. `PUBLIC`, `RESEARCHER`, `ACADEMIA`).
- `409 Conflict` → Duplicate `parcelNumber`.

---

## PUT /api/land-records/{id}

Update an existing land record. Restricted to `GOVERNMENT_OFFICIAL` and `ADMIN`.

Request body format matches `POST /api/land-records`.

### Responses

- `200 OK` → Updated record.
- `400 Bad Request` → Validation error or invalid geometry.
- `403 Forbidden` → Insufficient permissions.
- `404 Not Found` → Record does not exist.
- `409 Conflict` → Updated `parcelNumber` collides with another record.

---

## DELETE /api/land-records/{id}

Delete a land record. Restricted strictly to `ADMIN`.

### Responses

- `204 No Content` → Successfully deleted.
- `403 Forbidden` → Caller is not an `ADMIN` (e.g., `GOVERNMENT_OFFICIAL` gets 403 Forbidden).
- `404 Not Found` → Record does not exist.
