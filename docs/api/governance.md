# Governance Indicators API Documentation

Phase 9A and Phase 9B.1 establish the **Governance Indicator Foundation & Query Architecture**, providing deterministic, evidence-linked, and immutable governance analytics across spatial administrative tiers (State, District, Tehsil, Village) and collaborative project scopes.

---

## 1. Overview & Core Architecture

1. **Deterministic Calculation Authority**: Snapshot and query metrics (`numericValue`, `denominator`, `breakdownJson`) are calculated exclusively by database aggregations over authenticated spatial cadastral data (`land_records` / `project_land_records`) via `GovernanceCalculationRepository`, preventing client forgery of authoritative metrics.
2. **Current Data vs. Persisted Snapshot Distinction**:
   - **Current Query / Real-Time Calculation**: Executed directly against live `land_records` or `project_land_records`. Deterministic, parameterized SQL aggregation without persisting to storage.
   - **Persisted Snapshot**: Historical, immutable analytical record in `governance_indicator_snapshots`. Created explicitly with provenance, version tracking, and timestamp auditability.
3. **Approved Scope Hierarchy**:
   The platform strictly enforces the following administrative scope types (no `NATIONAL` scope):
   - `STATE`: `state` is required. Child fields (`district`, `tehsil`, `village`) and `projectId` must be null.
   - `DISTRICT`: `state` and `district` are required. Child fields (`tehsil`, `village`) and `projectId` must be null.
   - `TEHSIL`: `state`, `district`, and `tehsil` are required. Child field `village` and `projectId` must be null.
   - `VILLAGE`: `state`, `district`, `tehsil`, and `village` are all required. `projectId` must be null.
   - `PROJECT`: `projectId` is required. Geographic fields (`state`, `district`, `tehsil`, `village`) must be null.
   *Invalid combinations or missing hierarchy elements are rejected with explicit `400 Bad Request` validation errors rather than silently falling back to a broader scope.*
4. **Geographic Filtering Precision**:
   - Queries are parameterized inside PostgreSQL.
   - A `DISTRICT` query for Madhya Pradesh / Bhopal filters strictly by `lr.state = ? AND lr.district = ?`, preventing data from other districts from leaking in.
   - A `TEHSIL` query filters strictly by `state`, `district`, and `tehsil`.
   - A `VILLAGE` query filters strictly by all four tiers.
   - A `PROJECT` query joins `project_land_records` on `plr.project_id = ?`, completely isolating project cadastral data from other projects.
5. **Indicator Validation & Supported Calculations**:
   - Indicator codes are validated against `GovernanceIndicatorDefinitionRepository` (active definition authority) and `GovernanceCalculationRepository.SUPPORTED_INDICATOR_CODES`.
   - Unknown indicator codes safely fail with `404 Not Found`.
   - Inactive indicators fail with `400 Bad Request`.
   - Supported deterministic calculation indicators (Phase 9A established baseline):
     1. `PARCEL_COUNT_BY_LAND_USE` (Cadastral parcel count grouped by land use classification)
     2. `AREA_BY_LAND_USE` (Total cadastral area in square meters partitioned by land use classification)
     3. `LAND_USE_SHARE` (Dominant percentage share and proportional distribution of land use)
     4. `PARCEL_COUNT_BY_OWNERSHIP` (Parcel counts partitioned by ownership structure)
     5. `AREA_BY_OWNERSHIP` (Total cadastral area in square meters partitioned by ownership structure)
     6. `OWNERSHIP_SHARE` (Dominant percentage share and proportional distribution of ownership)
     7. `ACTIVE_PARCEL_COUNT` (Count and ratio of active undisputed cadastral parcels)
     8. `DISPUTED_PARCEL_COUNT` (Count and ratio of parcels flagged under legal or title dispute)
     9. `PENDING_VERIFICATION_COUNT` (Count and ratio of parcels pending survey or revenue verification)
     10. `INACTIVE_PARCEL_COUNT` (Count and ratio of deactivated or amortized parcels)
   - Arbitrary request strings are never interpolated into SQL statements.
6. **Visibility & Authorization Model**:
   - **Regional Snapshots**:
     - `INTERNAL`: Accessible only to users with `GOVERNMENT_OFFICIAL` or `ADMIN` roles.
     - `PUBLISHED`: Publicly accessible to external researchers and anonymous users.
   - **Project Snapshots**:
     - Access control is governed strictly by `CollaborationSecurityService`.
     - Unauthorized requests to private projects return `404 Not Found` (preserving IDOR protection and preventing information leakage).
7. **Evidence & Provenance Integrity**:
   - Every evidence linkage connects a snapshot to a `research_document_id` and/or `document_chunk_id`.
   - Database constraint `ck_gov_evidence_target` strictly prevents empty provenance records.
   - Formal evidence types: `STATUTORY_BENCHMARK`, `ADMINISTRATIVE_CIRCULAR`, `AUDIT_PRECEDENT`, `METHODOLOGICAL_STANDARD`, `POLICY_FRAMEWORK`.

---

## 2. Endpoints Summary

| Method | Endpoint | Access Control | Description |
|---|---|---|---|
| `GET` | `/api/governance/indicators` | Public | List active governance indicator definitions (optional `category` query param) |
| `GET` | `/api/governance/indicators/{code}` | Public | Retrieve detailed definition metadata for an indicator code |
| `POST` | `/api/governance/snapshots` | Authenticated (Official / Admin / Contributor) | Generate and persist a deterministic governance indicator snapshot |
| `GET` | `/api/governance/snapshots/{id}` | Role / Member | Retrieve snapshot details (enforces IDOR / visibility checks) |
| `GET` | `/api/governance/snapshots` | Public / Role | Query persisted snapshots by scope hierarchy (`scopeType`, `state`, `district`, `tehsil`, `village`, `indicatorCode`) |
| `GET` | `/api/projects/{projectId}/governance-snapshots` | Project Member | List all persisted snapshots calculated for a specific project |
| `GET` | `/api/governance/snapshots/{snapshotId}/evidence` | Role / Member | List linked evidence items with provenance and chunk texts |
| `POST` | `/api/governance/snapshots/{snapshotId}/evidence` | Authorized Official / Contributor | Link statutory / policy evidence or document chunk to a snapshot |
| `DELETE` | `/api/governance/snapshots/{snapshotId}/evidence/{evidenceId}` | Authorized Official / Contributor | Remove an evidence linkage from a snapshot |

---

## 3. Data Models & Payloads

### Indicator Definition Response
```json
{
  "id": "00000000-0000-0000-0009-000000000008",
  "code": "DISPUTED_PARCEL_COUNT",
  "name": "Disputed Parcel Count",
  "description": "Total count of cadastral parcels flagged with active legal or title disputes.",
  "category": "STATUS_DISTRIBUTION",
  "unit": "COUNT",
  "aggregationMethod": "COUNT",
  "sourceDomain": "LAND_RECORD",
  "calculationVersion": "1.0",
  "active": true,
  "createdAt": "2026-09-24T00:00:00Z",
  "updatedAt": "2026-09-24T00:00:00Z"
}
```

### Create Snapshot Request
```json
{
  "indicatorCode": "DISPUTED_PARCEL_COUNT",
  "scopeType": "DISTRICT",
  "state": "Madhya Pradesh",
  "district": "Bhopal",
  "visibility": "INTERNAL",
  "asOf": "2026-09-24T00:00:00Z",
  "sourceDataVersion": "cadastral-v1"
}
```

### Snapshot Response
```json
{
  "id": "b6110000-0000-0000-0000-000000000001",
  "indicatorDefinitionId": "00000000-0000-0000-0009-000000000008",
  "indicatorCode": "DISPUTED_PARCEL_COUNT",
  "indicatorName": "Disputed Parcel Count",
  "category": "STATUS_DISTRIBUTION",
  "unit": "COUNT",
  "projectId": null,
  "scopeType": "DISTRICT",
  "state": "Madhya Pradesh",
  "district": "Bhopal",
  "tehsil": null,
  "village": null,
  "visibility": "INTERNAL",
  "asOf": "2026-09-24T00:00:00Z",
  "periodStart": null,
  "periodEnd": null,
  "numericValue": 142.0000,
  "denominator": 5000.0000,
  "breakdownJson": "{\"disputedParcels\": 142, \"totalParcels\": 5000}",
  "calculationVersion": "1.0",
  "sourceDataTimestamp": "2026-09-24T00:00:00Z",
  "sourceDataVersion": "cadastral-v1",
  "generatedById": "c7110000-0000-0000-0000-000000000001",
  "generatedByName": "Admin Officer",
  "generatedAt": "2026-09-24T01:00:00Z",
  "evidenceCount": 1
}
```

### Link Evidence Request
```json
{
  "researchDocumentId": "d8110000-0000-0000-0000-000000000001",
  "documentChunkId": "e9110000-0000-0000-0000-000000000001",
  "evidenceType": "ADMINISTRATIVE_CIRCULAR",
  "rationale": "State revenue circular mandating resolution timeline for disputed parcels",
  "similarityScore": 0.8800
}
```

---

## 4. Query Foundation Components

- `GovernanceQueryService`: Coordinates scope validation, indicator definition and capability checks, project authorization, and delegates deterministic SQL calculations to `GovernanceCalculationRepository`.
- `GovernanceScopeQuery`: Encapsulates and auto-normalizes scope parameters (trimmed, blank values converted to null).
- `CurrentIndicatorQueryResult`: Immutable DTO for real-time live queries over current land records without snapshot persistence.
- `GovernanceCalculationRepository`: The deterministic calculation authority performing pure PostgreSQL aggregations over `land_records` and `project_land_records`.
