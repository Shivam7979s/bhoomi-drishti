# Governance Indicators API Documentation

Phase 9A introduces the **Governance Indicator Foundation**, providing deterministic, evidence-linked, and immutable governance analytics across spatial administrative tiers (State, District, Tehsil, Village) and collaborative project scopes.

---

## 1. Overview & Core Principles

1. **Deterministic Calculation Authority**: Snapshot metrics (`numericValue`, `denominator`, `breakdown`) are calculated exclusively by backend database aggregations over authenticated spatial cadastral data (`land_records`), preventing client forgery of authoritative metrics.
2. **Immutability**: Governance snapshots represent historical analytical records. All calculation fields are immutable (`updatable = false`), and project deletion uses `ON DELETE RESTRICT` to preserve historical integrity.
3. **Visibility & Publication Model**:
   - `INTERNAL`: Default visibility for regional snapshots and project scopes. Accessible only to government officials, administrators, or authorized project collaborators.
   - `PUBLISHED`: Explicitly published regional snapshots accessible to public and external researchers.
4. **Evidence & Provenance Integrity**:
   - Every evidence linkage connects a snapshot to a `research_document_id` and/or `document_chunk_id`.
   - Database check constraint `ck_gov_evidence_target` strictly prevents empty provenance records.
   - Evidence types represent formal administrative precedents (`STATUTORY_BENCHMARK`, `ADMINISTRATIVE_CIRCULAR`, `AUDIT_PRECEDENT`, `METHODOLOGICAL_STANDARD`, `POLICY_FRAMEWORK`).

---

## 2. Endpoints Summary

| Method | Endpoint | Access Control | Description |
|---|---|---|---|
| `GET` | `/api/governance/indicators` | Public | List active governance indicator definitions (optional `category` filter) |
| `GET` | `/api/governance/indicators/{code}` | Public | Retrieve detailed definition metadata for an indicator code |
| `POST` | `/api/governance/snapshots` | Authenticated | Generate a deterministic governance indicator snapshot |
| `GET` | `/api/governance/snapshots/{id}` | Role / Member | Retrieve snapshot details (enforces IDOR / visibility checks) |
| `GET` | `/api/governance/projects/{projectId}/snapshots` | Project Member | List all snapshots calculated for a specific project |
| `POST` | `/api/governance/snapshots/{id}/evidence` | Authorized | Link statutory / policy evidence or document chunk to a snapshot |
| `GET` | `/api/governance/snapshots/{id}/evidence` | Role / Member | List linked evidence items with provenance and chunk texts |
| `DELETE` | `/api/governance/snapshots/{id}/evidence/{evidenceId}` | Authorized | Remove an evidence linkage from a snapshot |

---

## 3. Data Models & Payloads

### Indicator Definition Response
```json
{
  "id": "a5000000-0000-0000-0000-000000000001",
  "code": "DISPUTED_PARCEL_COUNT",
  "name": "Disputed Parcel Count",
  "description": "Total number of land parcels flagged with active legal or title disputes",
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
  "indicatorDefinitionId": "a5000000-0000-0000-0000-000000000001",
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
  "breakdownJson": "{\"disputedRate\": 0.0284, \"activeCount\": 4500, \"totalCount\": 5000}",
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

## 4. Database Schema (Flyway V7)

- `governance_indicator_definitions`: Seeded with 10 standardized core land governance indicators.
- `governance_indicator_snapshots`: Historical calculation storage with scope constraints, foreign key restrictions, and unique indicators.
- `governance_indicator_evidence`: Provenance linkage table enforcing chunk/document consistency and duplicate prevention.
