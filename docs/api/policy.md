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

## 4. Next Sub-Phases Roadmap

- **Phase 8B**: PostGIS policy simulation engine (SQL aggregation service for baseline and scenario impact calculations).
- **Phase 8C**: Evidence & provenance linking service (linking Phase 5 vector chunks and citations).
- **Phase 8D**: Scenario comparison engine and REST API endpoints.
- **Phase 8E**: Frontend scenario workspace (builder form, KPI cards, Leaflet map overlays, comparison charts).
- **Phase 8F**: Comprehensive live verification, tests, and documentation.
