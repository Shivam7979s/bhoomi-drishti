# Policy Intelligence & Scenario Analysis — Domain & Schema Foundation (Phase 8A)

Phase 8 introduces policy intelligence and spatial scenario analysis to BHOOMI-DRISHTI, enabling researchers and government officials to model, evaluate, and compare proposed land governance interventions (e.g. agricultural-to-residential re-zoning, land ceiling redistribution, dispute vulnerability risk, and infrastructure buffer corridors) against real cadastral records with supporting statutory and research evidence.

Phase 8A establishes the database schema, domain entities, enums, repositories, DTOs, and lifecycle rules.

---

## 1. Domain Architecture

A `PolicyScenario` belongs to a `Project` (which in turn belongs to a `Workspace`). This hierarchy ensures:
1. Multi-tenant isolation and role inheritance from Phase 7 (`LEAD`, `CONTRIBUTOR`, `VIEWER`).
2. Scenarios operate within the specific research context of the project.
3. Access control is naturally scoped without redundant permissions.

### Entity Relationship Model

- **`PolicyScenario`**: Top-level entity representing a simulated policy intervention.
  - Linked to `projects(id)` and `app_user(id)`.
  - Scoped slug uniqueness: unique per project (`uq_scenarios_project_slug`).
  - Supported lifecycle states: `DRAFT`, `RUNNING`, `COMPLETED`, `ARCHIVED`.
- **`ScenarioParameter`**: 1-to-1 parameter configuration attached to a scenario.
  - Geographic boundaries (`target_state`, `target_district`, `target_tehsil`, `target_village`).
  - Optional spatial intervention geometry (`intervention_geometry`, PostGIS SRID 4326).
  - Transformation rules: `source_land_use`, `target_land_use`, `conversion_percentage` ($0 \le x \le 100$).
  - Regulatory constraints: `max_ownership_area` ($\ge 0$), `target_ownership_type`.
  - Buffer distance: `buffer_distance_meters` ($\ge 0$).
  - Extensible JSON parameters: `custom_parameters` (`jsonb`).
- **`ScenarioResult`**: Persisted output of a scenario execution run.
  - Metrics: `total_parcels_evaluated`, `total_parcels_affected`, `total_area_affected_sqm`, `baseline_area_sqm`, `simulated_area_sqm`, `disputed_parcels_count`, `disputed_area_sqm`.
  - Distribution summaries: `land_use_distribution_json`, `ownership_distribution_json`, `spatial_summary_json` (`jsonb`).
  - Auditing: `executed_by`, `executed_at`.
- **`ScenarioEvidence`**: Statutory guidelines, circulars, or research documents linked as policy basis.
  - Invariant: Must reference at least one of `research_documents(id)` or `document_chunks(id)`.
  - Categorization: `STATUTORY_AUTHORITY`, `DISPUTE_PRECEDENT`, `ENVIRONMENTAL_BASELINE`, `POLICY_GUIDELINE`, `METHODOLOGICAL_REFERENCE`.
  - Includes `similarity_score` and `rationale`.
- **`ScenarioAffectedParcel`**: Individual parcels affected by the simulation.
  - Composite primary key: `(scenario_result_id, land_record_id)`.
  - Captures `baseline_land_use`, `simulated_land_use`, `parcel_area_sqm`, and parcel `status`.
  - **Privacy Guarantee**: Does NOT store `owner_name` or `owner_identifier`. Owner PII is masked dynamically via existing Phase 3/6 LandRecord projections.

---

## 2. Supported Scenario Types (Phase 8A)

| ScenarioType | Description |
|---|---|
| `LAND_USE_CONVERSION` | Simulates re-zoning (e.g. converting a percentage of agricultural parcels to residential or commercial use within a target region). |
| `LAND_CEILING_REDISTRIBUTION` | Models parcel area thresholds on individual holdings to identify surplus land for redistribution. |
| `DISPUTE_RISK_ASSESSMENT` | Evaluates the concentration of disputed parcels (`status = 'DISPUTED'` or `PENDING_VERIFICATION`) within a planned development or acquisition zone. |
| `CORRIDOR_BUFFER_INTERVENTION` | Identifies parcels intersecting a spatial buffer (e.g. 500m along an infrastructure corridor or canal axis). |
| `PROJECT_PARCEL_EVALUATION` | Evaluates policy impacts specifically across the pre-curated parcels in `project_land_records`. |

---

## 3. Database Schema (`V6__create_policy_scenario_tables.sql`)

### Tables Created:
1. `policy_scenarios`
2. `scenario_parameters`
3. `scenario_results`
4. `scenario_evidence`
5. `scenario_affected_parcels`

### Key Constraints:
- `ck_scenarios_status`: `status IN ('DRAFT', 'RUNNING', 'COMPLETED', 'ARCHIVED')`
- `ck_scenarios_type`: strictly enforces deterministic scenario types.
- `ck_params_conversion_pct`: `conversion_percentage BETWEEN 0.00 AND 100.00`
- `ck_params_buffer_dist`: `buffer_distance_meters >= 0.00`
- `ck_params_max_ownership_area`: `max_ownership_area >= 0.00`
- `ck_evidence_target_not_empty`: `research_document_id IS NOT NULL OR document_chunk_id IS NOT NULL`
- `pk_scenario_affected_parcels`: Composite PK on `(scenario_result_id, land_record_id)` prevents duplicate parcel entries.
- Spatial index: `idx_scenario_params_geom ON scenario_parameters USING GIST (intervention_geometry)`.

---

---

## 4. PostGIS Policy Simulation Engine (Phase 8B)

> [!IMPORTANT]
> **Deterministic Analysis Notice:**
> This engine performs deterministic analysis over available land-record data. It does not predict future outcomes or recommend policy decisions.

### Architecture & Service API

The simulation engine is implemented by `PolicySimulationService` and backed by `PolicySimulationQueryRepository`:

```java
ScenarioResultResponse executeScenario(UUID scenarioId, Authentication auth);
ScenarioResultResponse executeScenario(UUID scenarioId, UUID executedById);
ScenarioResultResponse executeScenario(UUID scenarioId, User executedBy);
```

### Execution Lifecycle Pipeline

The simulation follows a strict deterministic pipeline:

```
PolicyScenario (DRAFT / COMPLETED)
       ↓
1. Validate scenario exists and is not ARCHIVED
       ↓
2. Verify project authorization (contribute / lead access)
       ↓
3. Validate ScenarioParameter completeness and domain invariants
       ↓
4. Transition scenario status to RUNNING
       ↓
5. Resolve eligible candidate parcels via PostGIS queries
       ↓
6. Compute baseline metrics (area, count, dispute exposure)
       ↓
7. Apply deterministic transformation (stable parcel order)
       ↓
8. Compute simulated distributions (land use, ownership)
       ↓
9. Persist ScenarioResult (flushed to satisfy foreign keys)
       ↓
10. Persist ScenarioAffectedParcel snapshots
       ↓
11. Mark scenario status COMPLETED
```

If an error or domain validation exception occurs, the transaction rolls back cleanly, ensuring no orphaned `scenario_results` or `scenario_affected_parcels` rows exist and the scenario status is not permanently left in `RUNNING`.

---

## 5. Deterministic Rules by Scenario Type

1. **`LAND_USE_CONVERSION`**:
   - Eligible parcels are filtered by administrative boundaries (`state`, `district`, `tehsil`, `village`), `source_land_use`, and optional geometry.
   - Stable deterministic selection: parcels ordered by `lr.parcel_number ASC, lr.id ASC`.
   - Affected count rule: $\lfloor \text{candidateCount} \times \frac{\text{conversionPercentage}}{100} \rfloor$.
   - Selected parcels receive `simulated_land_use = targetLandUse`.
   - Unaffected parcels remain unchanged.
   - **Crucial Rule:** The simulation never mutates actual `land_records.land_use_type`.

2. **`LAND_CEILING_REDISTRIBUTION`**:
   - Evaluates parcels against `max_ownership_area`.
   - Current system is parcel-centric: parcel-level ceiling analysis is conducted.
   - Identifies all parcels where $\text{landAreaSqMeters} > \text{maxOwnershipArea}$.
   - Measures surplus and affected records without inventing artificial beneficiaries or distribution targets.

3. **`DISPUTE_RISK_ASSESSMENT`**:
   - Evaluates existing recorded dispute vulnerability using `status = 'DISPUTED'`.
   - Computes deterministic dispute rate and disputed area exposure.
   - Non-predictive: reports existing recorded vulnerability without claiming to predict future litigation.

4. **`CORRIDOR_BUFFER_INTERVENTION`**:
   - Requires valid `intervention_geometry` and non-negative `buffer_distance_meters`.
   - PostGIS geography-aware spatial query:
     ```sql
     ST_DWithin(
         lr.boundary::geography,
         ST_SetSRID(ST_GeomFromText(?, 4326), 4326)::geography,
         buffer_distance_meters
     )
     ```
   - Accurately interprets buffer distance in meters across ellipsoidal coordinates.

5. **`PROJECT_PARCEL_EVALUATION`**:
   - Evaluates parcels strictly linked to the scenario's project via `project_land_records`.
   - Multi-tenant security ensures a project scenario cannot inspect parcels outside its authorized project boundary.

---

## 6. Persisted Metrics & Privacy

### Persisted Metric Definitions

- `totalParcelsEvaluated`: Count of candidate parcels matching scenario scope.
- `totalParcelsAffected`: Count of parcels transformed or exceeding criteria.
- `totalAreaAffectedSqm`: Sum of `land_area_sq_meters` of affected parcels (scale 2).
- `baselineAreaSqm`: Total evaluated baseline area (scale 2).
- `simulatedAreaSqm`: Simulated total land area (scale 2).
- `disputedParcelsCount`: Count of parcels with `status = 'DISPUTED'` in evaluation scope.
- `disputedAreaSqm`: Disputed area in square meters.
- `landUseDistributionJson`: Categorical breakdown `{"AGRICULTURAL": {"parcelCount": N, "areaSqMeters": X}, ...}`.
- `ownershipDistributionJson`: Categorical breakdown by `OwnershipType`.
- `spatialSummaryJson`: Spatial bounding box (`minLon`, `minLat`, `maxLon`, `maxLat`) and execution metadata.

### Privacy Guarantees

- `ScenarioResult` and `ScenarioAffectedParcel` tables store **ZERO owner personal data**.
- Fields `owner_name` and `owner_identifier` are never included in JSON summaries or snapshot tables.
- Reruns create new versioned `ScenarioResult` snapshots without corrupting prior execution runs.

---

## 7. Next Sub-Phases Roadmap

- **Phase 8C**: Evidence & provenance linking service (linking Phase 5 vector chunks and citations).
- **Phase 8D**: Scenario comparison engine and REST API endpoints.
- **Phase 8E**: Frontend scenario workspace (builder form, KPI cards, Leaflet map overlays, comparison charts).
- **Phase 8F**: Comprehensive live verification, tests, and documentation.
