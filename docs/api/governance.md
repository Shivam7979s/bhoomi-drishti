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
| `GET` | `/api/governance/summary` | Public / Member | Generate a real-time, live administrative governance summary across evaluated indicators for a scope |
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

### Administrative Summary Response (`GET /api/governance/summary`)
```json
{
  "scope": {
    "scopeType": "DISTRICT",
    "state": "Madhya Pradesh",
    "district": "Bhopal",
    "tehsil": null,
    "village": null,
    "projectId": null,
    "projectName": null
  },
  "summaryMode": "LIVE",
  "generatedAt": "2026-09-24T12:00:00Z",
  "sourceDataTimestamp": "2026-09-24T11:45:00Z",
  "calculationVersion": "1.0",
  "totalIndicatorsEvaluated": 10,
  "indicators": [
    {
      "indicatorCode": "ACTIVE_PARCEL_COUNT",
      "indicatorName": "Active Cadastral Parcel Count",
      "category": "STATUS_DISTRIBUTION",
      "unit": "COUNT",
      "aggregationMethod": "COUNT",
      "numericValue": 450.0000,
      "denominator": 500.0000,
      "breakdownJson": "{\"activeParcels\": 450, \"totalParcels\": 500}",
      "sourceDataTimestamp": "2026-09-24T11:45:00Z"
    },
    {
      "indicatorCode": "DISPUTED_PARCEL_COUNT",
      "indicatorName": "Disputed Parcel Count",
      "category": "STATUS_DISTRIBUTION",
      "unit": "COUNT",
      "aggregationMethod": "COUNT",
      "numericValue": 25.0000,
      "denominator": 500.0000,
      "breakdownJson": "{\"disputedParcels\": 25, \"totalParcels\": 500}",
      "sourceDataTimestamp": "2026-09-24T11:40:00Z"
    }
  ]
}
```

---

## 4. Administrative Summary Semantics (Phase 9B.2)

1. **Live-Only Calculation**:
   - `GET /api/governance/summary` executes calculations in real time directly inside PostgreSQL over current `land_records` or `project_land_records`.
   - Results are **never persisted** to `governance_indicator_snapshots`.
   - The response explicitly declares `summaryMode = "LIVE"`. Field `snapshotId` is omitted.
2. **Indicator Selection Invariants**:
   - **Default**: Evaluates all 10 established Phase 9A standard indicators.
   - **Category Filter**: Evaluates only indicators belonging to the requested `category` (`LAND_USE`, `OWNERSHIP`, `STATUS_DISTRIBUTION`).
   - **Explicit Indicators**: Validates each code in `indicators` against database definitions and supported calculations.
   - **Intersection**: If both `category` and `indicators` are supplied, only requested indicators matching the category are evaluated. If the intersection is empty, the request fails with `400 Bad Request`.
3. **Temporal Tracking**:
   - `generatedAt`: The exact timestamp when the summary was generated by the server.
   - `sourceDataTimestamp`: The maximum update timestamp (`MAX(lr.updated_at)`) among the underlying records evaluated.
4. **Descriptive Invariance**:
   - Summaries are purely descriptive and factual.
   - The endpoint strictly does NOT compute predictive risk scores, rankings, quality indices, or AI-generated recommendations.
5. **Privacy & Security Guarantees**:
   - Outputs are strictly aggregate. Individual parcel owner names, owner identifiers, Aadhaar, PAN, phone numbers, and emails are never returned.
   - `PROJECT` scope queries require view access via `CollaborationSecurityService`; unauthorized callers receive `404 Not Found` (IDOR safe).

---

## 5. Query Foundation Components

- `GovernanceQueryService`: Coordinates scope validation, indicator definition and capability checks, project authorization, and delegates deterministic SQL calculations to `GovernanceCalculationRepository`.
- `GovernanceScopeQuery`: Encapsulates and auto-normalizes scope parameters (trimmed, blank values converted to null).
- `CurrentIndicatorQueryResult`: Immutable DTO for real-time live queries over current land records without snapshot persistence.
- `GovernanceAdministrativeSummaryResponse`: Structured multi-indicator live governance summary for a jurisdiction or project.
- `GovernanceCalculationRepository`: The deterministic calculation authority performing pure PostgreSQL aggregations over `land_records` and `project_land_records`.

---

## 6. Frontend Governance Analytics Dashboard (Phase 9B.3)

The Governance Analytics Dashboard (`/governance`) provides an executive visualization layer over deterministic backend calculations:

1. **Dashboard Route**:
   - `/governance` is publicly accessible for regional aggregate summaries, with project-level analytics requiring authenticated workspace membership.
2. **Deterministic Architecture**:
   - The frontend acts strictly as a **presentation authority**. All calculations, aggregations, counts, and percentages remain authoritative within PostgreSQL via `GovernanceCalculationRepository`.
   - Client-side logic is limited strictly to number formatting, unit display conversions (e.g., m² to hectares), chart formatting, and presentation sorting.
3. **Supported Administrative Hierarchy**:
   - Full hierarchy exploration across `STATE`, `DISTRICT`, `TEHSIL`, `VILLAGE`, and `PROJECT` tiers.
   - Cascading dropdowns dynamically populate valid options using GIS boundary services and reset child tiers on parent changes.
   - Valid query detection prevents partial or invalid requests from hitting the backend.
4. **LIVE Semantics**:
   - Connects exclusively to real-time `GET /api/governance/summary` calculations.
   - Explicitly displays metadata badges for `LIVE` status, calculation version `v1.0`, generation timestamp, and underlying PostgreSQL record freshness (`sourceDataTimestamp`).
   - Does not implement historical snapshot browsing, date-range pickers, or time-travel modes.
5. **Security, Privacy & IDOR Protection**:
   - Regional metrics are strictly aggregate. Individual parcel owners, identifiers, Aadhaar, PAN, phone numbers, and geometries are never exposed.
   - Access to `PROJECT` summaries is protected by `CollaborationSecurityService`. Unauthorized requests return a generic `404 Not Found` / "Project Not Found or Inaccessible" message to avoid leaking project existence.
6. **Data Integrity & Non-Truncation**:
   - Chart breakdowns and indicators table display all backend-provided categories without silent data drops or arbitrary slicing (`slice(0, 8)` is strictly forbidden).
   - Zero-data scopes (valid geographical scopes with no cadastral parcels) display valid zero metrics rather than triggering API error alerts.

---

## 7. Statutory Evidence & Audit Snapshot Integration (Phase 9B.4)

Phase 9B.4 bridges the live governance analytics dashboard with statutory legal evidence and immutable audit snapshots, introducing the **Evidence-First Provenance Explorer**:

1. **Explicit Semantics: LIVE vs. IMMUTABLE SNAPSHOT**:
   - The user interface strictly distinguishes between:
     - **LIVE**: Dynamic calculation evaluated over current cadastral records. Indicates current platform data state.
     - **IMMUTABLE SNAPSHOT**: Persisted calculation baseline frozen at a specific timestamp (`asOf`).
   - Editing, linking, or unlinking evidence attaches provenance citations but **never alters** the underlying persisted numerical calculation (`numericValue`, `denominator`).
2. **Evidence-First Candidate vs. Linked Workflow**:
   - Research documents, circulars, and precedents discovered via search or research hubs are explicitly treated as **Candidate Evidence**.
   - A document becomes **Linked Statutory Evidence** only when an authorized official or project contributor explicitly confirms the linkage with a legal rationale.
   - AI search assists in candidate discovery but never implies automated legal authority or statutory validity.
3. **Frontend-Heavy Architecture (Zero Backend / Zero DB Migration)**:
   - Leverages existing Flyway `V7__create_governance_indicator_foundation.sql` tables: `governance_indicator_definitions`, `governance_indicator_snapshots`, and `governance_indicator_evidence`.
   - Reuses existing backend controllers (`GovernanceIndicatorController`, `ScenarioEvidenceController`) and security verifications (`CollaborationSecurityService`).
   - Zero database migrations (`V7` remains current; no `V8`).
4. **Delivered UI Capabilities**:
   - `GovernanceIndicatorDetailDrawer`: Side drawer displaying statutory indicator definitions, methodology benchmarks, and legally linked circulars/statutes.
   - `GovernanceSnapshotModal`: Modal to capture point-in-time calculation baselines with visibility control (`INTERNAL` vs `PUBLISHED`) and source version annotations.
   - `GovernanceEvidenceLinkModal`: Modal to link statutory circulars, policy frameworks, and audit precedents to snapshots with explicit rationale and citation references.
   - `GovernanceSnapshotAuditList`: Historical audit snapshot archive table embedded below the live dashboard, displaying frozen values, timestamps, visibility badges, and evidence count.
   - `ProjectGovernanceSnapshotsTab`: Dedicated Governance tab in project workspaces (`/workspaces/:workspaceId/projects/:projectId`), allowing project contributors to capture project-scoped baselines and link statutory legal dossiers.
