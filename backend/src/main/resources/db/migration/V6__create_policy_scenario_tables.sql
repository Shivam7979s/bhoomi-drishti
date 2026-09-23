-- ---------------------------------------------------------------------------
-- BHOOMI-DRISHTI - Phase 8A: Policy Intelligence & Scenario Analysis Foundation
--
-- Schema for Policy Scenarios, Scenario Parameters, Scenario Results,
-- Scenario Evidence linkages, and Scenario Affected Parcels.
-- ---------------------------------------------------------------------------

-- 1. Policy Scenarios
CREATE TABLE policy_scenarios
(
    id            UUID         NOT NULL,
    project_id    UUID         NOT NULL,
    created_by    UUID         NOT NULL,
    name          VARCHAR(200) NOT NULL,
    slug          VARCHAR(220) NOT NULL,
    description   TEXT,
    scenario_type VARCHAR(64)  NOT NULL,
    status        VARCHAR(32)  NOT NULL DEFAULT 'DRAFT',
    created_at    TIMESTAMPTZ  NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL,
    CONSTRAINT pk_policy_scenarios PRIMARY KEY (id),
    CONSTRAINT fk_scenarios_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_scenarios_created_by FOREIGN KEY (created_by)
        REFERENCES app_user (id) ON DELETE RESTRICT,
    CONSTRAINT uq_scenarios_project_slug UNIQUE (project_id, slug),
    CONSTRAINT ck_scenarios_status CHECK (status IN ('DRAFT', 'RUNNING', 'COMPLETED', 'ARCHIVED')),
    CONSTRAINT ck_scenarios_type CHECK (scenario_type IN (
        'LAND_USE_CONVERSION',
        'LAND_CEILING_REDISTRIBUTION',
        'DISPUTE_RISK_ASSESSMENT',
        'CORRIDOR_BUFFER_INTERVENTION',
        'PROJECT_PARCEL_EVALUATION'
    ))
);

CREATE INDEX idx_scenarios_project ON policy_scenarios (project_id);
CREATE INDEX idx_scenarios_status ON policy_scenarios (status);
CREATE INDEX idx_scenarios_type ON policy_scenarios (scenario_type);
CREATE INDEX idx_scenarios_created_by ON policy_scenarios (created_by);

-- 2. Scenario Parameters
CREATE TABLE scenario_parameters
(
    id                     UUID          NOT NULL,
    scenario_id            UUID          NOT NULL,
    target_state           VARCHAR(100),
    target_district        VARCHAR(100),
    target_tehsil          VARCHAR(100),
    target_village         VARCHAR(100),
    intervention_geometry  geometry(Geometry, 4326),
    source_land_use        VARCHAR(32),
    target_land_use        VARCHAR(32),
    conversion_percentage  NUMERIC(5, 2),
    max_ownership_area     NUMERIC(14, 2),
    target_ownership_type  VARCHAR(32),
    buffer_distance_meters NUMERIC(12, 2),
    custom_parameters      JSONB,
    created_at             TIMESTAMPTZ   NOT NULL,
    updated_at             TIMESTAMPTZ   NOT NULL,
    CONSTRAINT pk_scenario_parameters PRIMARY KEY (id),
    CONSTRAINT fk_params_scenario FOREIGN KEY (scenario_id)
        REFERENCES policy_scenarios (id) ON DELETE CASCADE,
    CONSTRAINT uq_scenario_parameters_scenario UNIQUE (scenario_id),
    CONSTRAINT ck_params_conversion_pct CHECK (
        conversion_percentage IS NULL OR (conversion_percentage >= 0.00 AND conversion_percentage <= 100.00)
    ),
    CONSTRAINT ck_params_max_ownership_area CHECK (
        max_ownership_area IS NULL OR max_ownership_area >= 0.00
    ),
    CONSTRAINT ck_params_buffer_dist CHECK (
        buffer_distance_meters IS NULL OR buffer_distance_meters >= 0.00
    ),
    CONSTRAINT ck_params_source_land_use CHECK (
        source_land_use IS NULL OR source_land_use IN (
            'AGRICULTURAL', 'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'GOVERNMENT', 'FOREST', 'OTHER'
        )
    ),
    CONSTRAINT ck_params_target_land_use CHECK (
        target_land_use IS NULL OR target_land_use IN (
            'AGRICULTURAL', 'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'GOVERNMENT', 'FOREST', 'OTHER'
        )
    ),
    CONSTRAINT ck_params_target_ownership CHECK (
        target_ownership_type IS NULL OR target_ownership_type IN (
            'INDIVIDUAL', 'JOINT', 'GOVERNMENT', 'COMMUNITY', 'OTHER'
        )
    )
);

CREATE INDEX idx_scenario_params_scenario ON scenario_parameters (scenario_id);
CREATE INDEX idx_scenario_params_geom ON scenario_parameters USING GIST (intervention_geometry);

-- 3. Scenario Results
CREATE TABLE scenario_results
(
    id                         UUID           NOT NULL,
    scenario_id                UUID           NOT NULL,
    executed_by                UUID           NOT NULL,
    executed_at                TIMESTAMPTZ    NOT NULL,
    total_parcels_evaluated    BIGINT         NOT NULL DEFAULT 0,
    total_parcels_affected     BIGINT         NOT NULL DEFAULT 0,
    total_area_affected_sqm    NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
    baseline_area_sqm          NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
    simulated_area_sqm         NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
    disputed_parcels_count     BIGINT         NOT NULL DEFAULT 0,
    disputed_area_sqm          NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
    land_use_distribution_json JSONB,
    ownership_distribution_json JSONB,
    spatial_summary_json       JSONB,
    CONSTRAINT pk_scenario_results PRIMARY KEY (id),
    CONSTRAINT fk_results_scenario FOREIGN KEY (scenario_id)
        REFERENCES policy_scenarios (id) ON DELETE CASCADE,
    CONSTRAINT fk_results_executed_by FOREIGN KEY (executed_by)
        REFERENCES app_user (id) ON DELETE RESTRICT,
    CONSTRAINT ck_results_evaluated_non_neg CHECK (total_parcels_evaluated >= 0),
    CONSTRAINT ck_results_affected_non_neg CHECK (total_parcels_affected >= 0),
    CONSTRAINT ck_results_area_affected_non_neg CHECK (total_area_affected_sqm >= 0.00),
    CONSTRAINT ck_results_baseline_area_non_neg CHECK (baseline_area_sqm >= 0.00),
    CONSTRAINT ck_results_simulated_area_non_neg CHECK (simulated_area_sqm >= 0.00),
    CONSTRAINT ck_results_disputed_count_non_neg CHECK (disputed_parcels_count >= 0),
    CONSTRAINT ck_results_disputed_area_non_neg CHECK (disputed_area_sqm >= 0.00)
);

CREATE INDEX idx_scenario_results_scenario ON scenario_results (scenario_id);
CREATE INDEX idx_scenario_results_executed_at ON scenario_results (executed_at);

-- 4. Scenario Evidence
CREATE TABLE scenario_evidence
(
    id                   UUID         NOT NULL,
    scenario_id          UUID         NOT NULL,
    research_document_id UUID,
    document_chunk_id    UUID,
    evidence_type        VARCHAR(64)  NOT NULL,
    rationale            TEXT,
    similarity_score     NUMERIC(5, 4),
    linked_by            UUID         NOT NULL,
    linked_at            TIMESTAMPTZ  NOT NULL,
    CONSTRAINT pk_scenario_evidence PRIMARY KEY (id),
    CONSTRAINT fk_evidence_scenario FOREIGN KEY (scenario_id)
        REFERENCES policy_scenarios (id) ON DELETE CASCADE,
    CONSTRAINT fk_evidence_document FOREIGN KEY (research_document_id)
        REFERENCES research_documents (id) ON DELETE CASCADE,
    CONSTRAINT fk_evidence_chunk FOREIGN KEY (document_chunk_id)
        REFERENCES document_chunks (id) ON DELETE CASCADE,
    CONSTRAINT fk_evidence_linked_by FOREIGN KEY (linked_by)
        REFERENCES app_user (id) ON DELETE RESTRICT,
    CONSTRAINT ck_evidence_target_not_empty CHECK (
        research_document_id IS NOT NULL OR document_chunk_id IS NOT NULL
    ),
    CONSTRAINT ck_evidence_type CHECK (evidence_type IN (
        'STATUTORY_AUTHORITY',
        'DISPUTE_PRECEDENT',
        'ENVIRONMENTAL_BASELINE',
        'POLICY_GUIDELINE',
        'METHODOLOGICAL_REFERENCE'
    ))
);

CREATE INDEX idx_scenario_evidence_scenario ON scenario_evidence (scenario_id);
CREATE INDEX idx_scenario_evidence_doc ON scenario_evidence (research_document_id);
CREATE INDEX idx_scenario_evidence_chunk ON scenario_evidence (document_chunk_id);

-- 5. Scenario Affected Parcels
CREATE TABLE scenario_affected_parcels
(
    scenario_result_id UUID           NOT NULL,
    land_record_id     UUID           NOT NULL,
    baseline_land_use  VARCHAR(32)    NOT NULL,
    simulated_land_use VARCHAR(32)    NOT NULL,
    parcel_area_sqm    NUMERIC(14, 2) NOT NULL,
    status             VARCHAR(32)    NOT NULL,
    CONSTRAINT pk_scenario_affected_parcels PRIMARY KEY (scenario_result_id, land_record_id),
    CONSTRAINT fk_sap_result FOREIGN KEY (scenario_result_id)
        REFERENCES scenario_results (id) ON DELETE CASCADE,
    CONSTRAINT fk_sap_land_record FOREIGN KEY (land_record_id)
        REFERENCES land_records (id) ON DELETE CASCADE,
    CONSTRAINT ck_sap_baseline_land_use CHECK (baseline_land_use IN (
        'AGRICULTURAL', 'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'GOVERNMENT', 'FOREST', 'OTHER'
    )),
    CONSTRAINT ck_sap_simulated_land_use CHECK (simulated_land_use IN (
        'AGRICULTURAL', 'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'GOVERNMENT', 'FOREST', 'OTHER'
    )),
    CONSTRAINT ck_sap_status CHECK (status IN (
        'ACTIVE', 'INACTIVE', 'DISPUTED', 'PENDING_VERIFICATION'
    ))
);

CREATE INDEX idx_sap_land_record ON scenario_affected_parcels (land_record_id);
