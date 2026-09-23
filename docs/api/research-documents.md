# Research Hub API (Phase 4)

Base URL (local development): `http://localhost:8080`.

The Research Hub provides a structured knowledge and evidence repository for research papers, policy documents, government reports, academic publications, datasets, case studies, and legal documents. It includes direct bidirectional linkage with Land Records (parcels).

---

## Authentication & Public Access Policy

- **Public Access**: Unauthenticated (public) users can query `GET /api/research-documents`, `GET /api/research-documents/{id}`, and `GET /api/research-documents/by-land-record/{landRecordId}`.
- **Strict Public Visibility**: Public callers and users with role `PUBLIC` can **only** view `PUBLISHED` documents.
- **Draft & Archived Protection**: Accessing a `DRAFT` or `ARCHIVED` document as an unauthenticated or `PUBLIC` user returns `404 Not Found` (to avoid leaking document existence or metadata).
- **Mutations & Linking**: All write, update, delete, and parcel linking endpoints require authentication.

---

## RBAC Matrix

| Role | Read Published | Read Draft/Archived | Create | Update | Delete | Link/Unlink Parcels |
|---|---|---|---|---|---|---|
| **PUBLIC** (or Unauthenticated) | ✅ All Published | ❌ 404 Not Found | ❌ 401/403 | ❌ 401/403 | ❌ 401/403 | ❌ 401/403 |
| **RESEARCHER** | ✅ | ✅ (Own created) | ✅ | ✅ (Own created only) | ❌ 403 | ✅ |
| **ACADEMIA** | ✅ | ✅ (Own created) | ✅ | ✅ (Own created only) | ❌ 403 | ✅ |
| **GOVERNMENT_OFFICIAL** | ✅ | ✅ | ✅ | ✅ | ❌ 403 | ✅ |
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

> **Ownership Rule**: `RESEARCHER` and `ACADEMIA` users can only update documents where `created_by` matches their own user account. Attempting to update another user's document returns `403 Forbidden`. `ADMIN` and `GOVERNMENT_OFFICIAL` can update any document. Only `ADMIN` can delete documents.

---

## Enums

### DocumentType
- `RESEARCH_PAPER`
- `POLICY_DOCUMENT`
- `GOVERNMENT_REPORT`
- `ACADEMIC_PUBLICATION`
- `DATASET`
- `CASE_STUDY`
- `LEGAL_DOCUMENT`

### ResearchDocumentStatus
- `DRAFT`
- `PUBLISHED`
- `ARCHIVED`

---

## GET /api/research-documents

List and filter research documents with server-side pagination and sorting.

### Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `search` | string | optional | Multi-field text search matching against `title`, `description`, `abstractText`, `authors`, `organization`, `keywords`, `language` (case-insensitive) |
| `documentType` | string | optional | Exact match on `DocumentType` enum |
| `status` | string | optional | Exact match on `ResearchDocumentStatus` enum (enforced `PUBLISHED` for public callers) |
| `organization` | string | optional | Case-insensitive substring match |
| `language` | string | optional | Case-insensitive match (e.g., `English`, `Hindi`) |
| `year` | integer | optional | Exact publication year (matches `publicationDate` year) |
| `linkedLandRecordId` | UUID | optional | Filter documents linked to a specific land record parcel |
| `page` | integer | `0` | Zero-based page number |
| `size` | integer | `20` | Page size (max: 100) |
| `sort` | string | `createdAt,desc` | Sort field and direction (e.g., `publicationDate,desc`, `title,asc`) |

### Example Request
```http
GET /api/research-documents?documentType=RESEARCH_PAPER&search=Bundelkhand&page=0&size=10 HTTP/1.1
Host: localhost:8080
```

### Response (200 OK)
```json
{
  "content": [
    {
      "id": "7f8c12a4-b49d-4763-952d-2092a8fc0911",
      "title": "Land Fragmentation and Soil Degradation in Bundelkhand",
      "description": "Comprehensive empirical study on parcel fragmentation.",
      "abstractText": "This research analyzes satellite imagery and registry records...",
      "documentType": "RESEARCH_PAPER",
      "status": "PUBLISHED",
      "authors": ["Dr. Ananya Sharma", "Prof. R. K. Verma"],
      "organization": "Indian Council of Agricultural Research",
      "publicationDate": "2025-11-15",
      "doi": "10.1016/j.landuse.2025.105432",
      "sourceUrl": "https://doi.org/10.1016/j.landuse.2025.105432",
      "fileUrl": "https://storage.bhoomidrishti.in/papers/bundelkhand-2025.pdf",
      "keywords": ["land degradation", "soil health", "Bundelkhand", "remote sensing"],
      "language": "English",
      "createdById": "2a15f0d3-3b10-449e-b710-3d71239c01a2",
      "createdByName": "Dr. Ananya Sharma",
      "linkedLandRecords": [
        {
          "id": "9d6558f0-aa89-4928-be6e-595a19a21a02",
          "parcelNumber": "MP-BHO-2026-001",
          "district": "Bhopal",
          "state": "Madhya Pradesh",
          "landUseType": "AGRICULTURAL",
          "status": "ACTIVE"
        }
      ],
      "createdAt": "2026-09-23T11:00:00Z",
      "updatedAt": "2026-09-23T11:00:00Z"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true
}
```

---

## GET /api/research-documents/{id}

Retrieve a single research document by UUID.

- Public/unauthenticated callers: Returns `200 OK` if status is `PUBLISHED`. Returns `404 Not Found` if status is `DRAFT` or `ARCHIVED` (or if not found).
- Authenticated users with appropriate role: Returns `200 OK` for all statuses (or `404 Not Found` if document does not exist).

### Response (200 OK)
Returns single `ResearchDocumentResponse` matching the structure above.

---

## POST /api/research-documents

Create a new research document. Restricted to `RESEARCHER`, `ACADEMIA`, `GOVERNMENT_OFFICIAL`, and `ADMIN`.

### Request Body
```json
{
  "title": "National Land Records Modernization Assessment Report 2026",
  "description": "Evaluation of cadastral digitisation progress across 12 states.",
  "abstractText": "This report examines digital land titling mechanisms...",
  "documentType": "GOVERNMENT_REPORT",
  "status": "PUBLISHED",
  "authors": "Ministry of Rural Development, Survey of India",
  "organization": "Ministry of Rural Development, GoI",
  "publicationDate": "2026-03-01",
  "sourceUrl": "https://dolr.gov.in/reports/2026-modernization.pdf",
  "fileUrl": "https://storage.bhoomidrishti.in/gov/nlrmp-2026.pdf",
  "keywords": "cadastral, DILRMP, survey, land titling",
  "language": "English",
  "linkedLandRecordIds": [
    "9d6558f0-aa89-4928-be6e-595a19a21a02"
  ]
}
```

### Validation Constraints
- `title`: Required, 1–255 characters.
- `description`: Required, 1–5000 characters.
- `documentType`: Required (`DocumentType` enum).
- `status`: Optional (`ResearchDocumentStatus` enum, default `DRAFT`).
- `authors`: Required, 1–255 characters (comma-separated author names).
- `organization`: Optional, up to 255 characters.
- `publicationDate`: Optional (ISO date `YYYY-MM-DD`).
- `sourceUrl` / `fileUrl`: Optional, up to 1024 characters.
- `keywords`: Optional, up to 512 characters (comma-separated).
- `abstractText`: Optional, up to 10000 characters.
- `language`: Optional, up to 32 characters.

### Response (201 Created)
Returns the created `ResearchDocumentResponse` with generated `id`, `createdById`, `createdByName`, `linkedLandRecords`, timestamps, and `Location` header.

---

## PUT /api/research-documents/{id}

Update an existing research document.
- `RESEARCHER` / `ACADEMIA`: Allowed only if the user created this document (`created_by` matches). Otherwise returns `403 Forbidden`.
- `GOVERNMENT_OFFICIAL` / `ADMIN`: Allowed to update any document.

### Request Body
Same fields as `POST /api/research-documents`. Omitted fields or updated fields are applied.

### Response (200 OK)
Returns the updated `ResearchDocumentResponse`.

---

## DELETE /api/research-documents/{id}

Permanently delete a research document. Restricted to `ADMIN` only.

- `204 No Content` on successful deletion.
- `403 Forbidden` if called by any non-ADMIN role.
- `404 Not Found` if document does not exist.

---

## POST /api/research-documents/{id}/land-records/{landRecordId}

Link a land record parcel to the specified research document.
- Restricted to `RESEARCHER`, `ACADEMIA`, `GOVERNMENT_OFFICIAL`, `ADMIN`.
- Returns `200 OK` with updated `ResearchDocumentResponse` including the newly linked land record summary.
- Idempotent: linking an already-linked parcel returns `200 OK` without error.
- Returns `404 Not Found` if research document or land record does not exist.

---

## DELETE /api/research-documents/{id}/land-records/{landRecordId}

Remove the link between a research document and a land record parcel.
- Restricted to `RESEARCHER`, `ACADEMIA`, `GOVERNMENT_OFFICIAL`, `ADMIN`.
- Returns `200 OK` with updated `ResearchDocumentResponse`.
- Idempotent: unlinking a parcel that is not currently linked returns `200 OK`.
- Returns `404 Not Found` if research document or land record does not exist.

---

## GET /api/research-documents/{id}/land-records

Retrieve all land record parcels linked to a specific research document.
- Accessible by all roles (including unauthenticated).
- Public callers will only receive linked land records with status `ACTIVE`.
- Returns a JSON array of `LandRecordResponse`.

---

## GET /api/land-records/{landRecordId}/research-documents

Retrieve all research documents linked to a specific land record parcel.
- Accessible by all roles (including unauthenticated).
- Public callers will only receive documents with status `PUBLISHED`.
- Returns a paginated `PageResponse<ResearchDocumentResponse>`.

---

## Standard Error Response Shape

All errors follow the project's centralized `ApiError` convention:

```json
{
  "error": "NOT_FOUND",
  "message": "Research document not found with id: 7f8c12a4-b49d-4763-952d-2092a8fc0911",
  "status": 404,
  "timestamp": "2026-09-23T11:00:00Z",
  "path": "/api/research-documents/7f8c12a4-b49d-4763-952d-2092a8fc0911"
}
```
