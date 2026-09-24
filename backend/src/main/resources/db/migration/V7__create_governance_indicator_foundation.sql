-- ---------------------------------------------------------------------------
-- BHOOMI-DRISHTI - Phase 9A: Governance Indicator Foundation
--
-- Schema for Governance Indicator Definitions, Governance Indicator Snapshots,
-- and Governance Indicator Evidence Linkages.
-- ---------------------------------------------------------------------------

-- 1. Governance Indicator Definitions
CREATE TABLE governance_indicator_definitions
(
    id                  UUID         NOT NULL,
    code                VARCHAR(64)  NOT NULL,
    name                VARCHAR(200) NOT NULL,
    description         TEXT,
    category            VARCHAR(64)  NOT NULL,
    unit                VARCHAR(32)  NOT NULL,
    aggregation_method  VARCHAR(32)  NOT NULL,
    source_domain       VARCHAR(64)  NOT NULL,
    calculation_version VARCHAR(32)  NOT NULL DEFAULT '1.0',
    active              BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL,
    updated_at          TIMESTAMPTZ  NOT NULL,
    CONSTRAINT pk_gov_indicator_definitions PRIMARY KEY (id),
    CONSTRAINT uq_gov_indicator_definitions_code UNIQUE (code),
    CONSTRAINT ck_gov_def_category CHECK (category IN (
        'LAND_USE', 'OWNERSHIP', 'STATUS_DISTRIBUTION', 'ADMINISTRATIVE'
    )),
    CONSTRAINT ck_gov_def_unit CHECK (unit IN (
        'COUNT', 'SQ_METERS', 'PERCENTAGE', 'RATIO'
    )),
    CONSTRAINT ck_gov_def_aggregation CHECK (aggregation_method IN (
        'SUM', 'COUNT', 'PERCENTAGE_SHARE', 'RATE'
    ))
);

CREATE INDEX idx_gov_def_active ON governance_indicator_definitions (active);
CREATE INDEX idx_gov_def_category ON governance_indicator_definitions (category);

-- 2. Governance Indicator Snapshots (Immutable calculation results)
CREATE TABLE governance_indicator_snapshots
(
    id                      UUID           NOT NULL,
    indicator_definition_id UUID           NOT NULL,
    project_id              UUID,
    scope_type              VARCHAR(32)    NOT NULL,
    state                   VARCHAR(100),
    district                VARCHAR(100),
    tehsil                  VARCHAR(100),
    village                 VARCHAR(100),
    visibility              VARCHAR(32)    NOT NULL DEFAULT 'INTERNAL',
    as_of                   TIMESTAMPTZ    NOT NULL,
    period_start            TIMESTAMPTZ,
    period_end              TIMESTAMPTZ,
    numeric_value           NUMERIC(18, 4) NOT NULL,
    denominator             NUMERIC(18, 4),
    breakdown               JSONB,
    calculation_version     VARCHAR(32)    NOT NULL,
    source_data_timestamp   TIMESTAMPTZ    NOT NULL,
    source_data_version     VARCHAR(64),
    generated_by            UUID           NOT NULL,
    generated_at            TIMESTAMPTZ    NOT NULL,
    CONSTRAINT pk_gov_indicator_snapshots PRIMARY KEY (id),
    CONSTRAINT fk_gov_snapshots_def FOREIGN KEY (indicator_definition_id)
        REFERENCES governance_indicator_definitions (id) ON DELETE RESTRICT,
    CONSTRAINT fk_gov_snapshots_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE RESTRICT,
    CONSTRAINT fk_gov_snapshots_user FOREIGN KEY (generated_by)
        REFERENCES app_user (id) ON DELETE RESTRICT,
    CONSTRAINT ck_gov_snapshots_scope CHECK (scope_type IN (
        'STATE', 'DISTRICT', 'TEHSIL', 'VILLAGE', 'PROJECT'
    )),
    CONSTRAINT ck_gov_snapshots_project_scope CHECK (
        (scope_type = 'PROJECT' AND project_id IS NOT NULL) OR
        (scope_type != 'PROJECT' AND project_id IS NULL)
    ),
    CONSTRAINT ck_gov_snapshots_regional_hierarchy CHECK (
        (scope_type = 'PROJECT') OR
        (scope_type = 'STATE' AND state IS NOT NULL) OR
        (scope_type = 'DISTRICT' AND state IS NOT NULL AND district IS NOT NULL) OR
        (scope_type = 'TEHSIL' AND state IS NOT NULL AND district IS NOT NULL AND tehsil IS NOT NULL) OR
        (scope_type = 'VILLAGE' AND state IS NOT NULL AND district IS NOT NULL AND tehsil IS NOT NULL AND village IS NOT NULL)
    ),
    CONSTRAINT ck_gov_snapshots_visibility CHECK (visibility IN (
        'INTERNAL', 'PUBLISHED'
    )),
    CONSTRAINT ck_gov_snapshots_period CHECK (
        period_end IS NULL OR period_start IS NULL OR period_end >= period_start
    )
);

CREATE INDEX idx_gov_snapshots_def ON governance_indicator_snapshots (indicator_definition_id);
CREATE INDEX idx_gov_snapshots_project ON governance_indicator_snapshots (project_id);
CREATE INDEX idx_gov_snapshots_scope ON governance_indicator_snapshots (scope_type, state, district, tehsil, village);
CREATE INDEX idx_gov_snapshots_as_of ON governance_indicator_snapshots (as_of);
CREATE INDEX idx_gov_snapshots_visibility ON governance_indicator_snapshots (visibility);
CREATE INDEX idx_gov_snapshots_generated_at ON governance_indicator_snapshots (generated_at);

-- 3. Governance Indicator Evidence
CREATE TABLE governance_indicator_evidence
(
    id                   UUID         NOT NULL,
    snapshot_id          UUID         NOT NULL,
    research_document_id UUID,
    document_chunk_id    UUID,
    evidence_type        VARCHAR(64)  NOT NULL,
    rationale            TEXT,
    similarity_score     NUMERIC(5, 4),
    linked_by            UUID         NOT NULL,
    linked_at            TIMESTAMPTZ  NOT NULL,
    CONSTRAINT pk_gov_indicator_evidence PRIMARY KEY (id),
    CONSTRAINT fk_gov_evidence_snapshot FOREIGN KEY (snapshot_id)
        REFERENCES governance_indicator_snapshots (id) ON DELETE CASCADE,
    CONSTRAINT fk_gov_evidence_doc FOREIGN KEY (research_document_id)
        REFERENCES research_documents (id) ON DELETE CASCADE,
    CONSTRAINT fk_gov_evidence_chunk FOREIGN KEY (document_chunk_id)
        REFERENCES document_chunks (id) ON DELETE CASCADE,
    CONSTRAINT fk_gov_evidence_user FOREIGN KEY (linked_by)
        REFERENCES app_user (id) ON DELETE RESTRICT,
    CONSTRAINT ck_gov_evidence_target CHECK (
        research_document_id IS NOT NULL OR document_chunk_id IS NOT NULL
    ),
    CONSTRAINT ck_gov_evidence_type CHECK (evidence_type IN (
        'STATUTORY_BENCHMARK',
        'ADMINISTRATIVE_CIRCULAR',
        'AUDIT_PRECEDENT',
        'METHODOLOGICAL_STANDARD',
        'POLICY_FRAMEWORK'
    )),
    CONSTRAINT ck_gov_evidence_score CHECK (
        similarity_score IS NULL OR (similarity_score >= -1.0000 AND similarity_score <= 1.0000)
    ),
    CONSTRAINT uq_gov_evidence UNIQUE (snapshot_id, research_document_id, document_chunk_id, evidence_type)
);

CREATE INDEX idx_gov_evidence_snapshot ON governance_indicator_evidence (snapshot_id);
CREATE INDEX idx_gov_evidence_doc ON governance_indicator_evidence (research_document_id);
CREATE INDEX idx_gov_evidence_chunk ON governance_indicator_evidence (document_chunk_id);

-- 4. Seed Standard Governance Indicator Definitions
INSERT INTO governance_indicator_definitions (
    id, code, name, description, category, unit, aggregation_method, source_domain, calculation_version, active, created_at, updated_at
) VALUES
(
    '00000000-0000-0000-0009-000000000001',
    'PARCEL_COUNT_BY_LAND_USE',
    'Parcel Count by Land Use Type',
    'Total count of cadastral parcels categorized by zoning and land use classification.',
    'LAND_USE',
    'COUNT',
    'COUNT',
    'LAND_RECORD',
    '1.0',
    TRUE,
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0009-000000000002',
    'AREA_BY_LAND_USE',
    'Total Area by Land Use Type',
    'Sum of land area in square meters classified across agricultural, residential, commercial, industrial, and forest designations.',
    'LAND_USE',
    'SQ_METERS',
    'SUM',
    'LAND_RECORD',
    '1.0',
    TRUE,
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0009-000000000003',
    'LAND_USE_SHARE',
    'Land Use Percentage Share',
    'Percentage proportion of designated land-use area relative to total evaluated cadastral area.',
    'LAND_USE',
    'PERCENTAGE',
    'PERCENTAGE_SHARE',
    'LAND_RECORD',
    '1.0',
    TRUE,
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0009-000000000004',
    'PARCEL_COUNT_BY_OWNERSHIP',
    'Parcel Count by Ownership Structure',
    'Count of cadastral holdings classified by individual, joint, government, and community ownership types.',
    'OWNERSHIP',
    'COUNT',
    'COUNT',
    'LAND_RECORD',
    '1.0',
    TRUE,
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0009-000000000005',
    'AREA_BY_OWNERSHIP',
    'Total Area by Ownership Structure',
    'Total land area in square meters partitioned by ownership structure categories.',
    'OWNERSHIP',
    'SQ_METERS',
    'SUM',
    'LAND_RECORD',
    '1.0',
    TRUE,
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0009-000000000006',
    'OWNERSHIP_SHARE',
    'Ownership Area Share',
    'Percentage share of holding area held by each ownership type relative to aggregate holding area.',
    'OWNERSHIP',
    'PERCENTAGE',
    'PERCENTAGE_SHARE',
    'LAND_RECORD',
    '1.0',
    TRUE,
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0009-000000000007',
    'ACTIVE_PARCEL_COUNT',
    'Active Cadastral Parcel Count',
    'Number of active, undisputed cadastral records in good statutory standing.',
    'STATUS_DISTRIBUTION',
    'COUNT',
    'COUNT',
    'LAND_RECORD',
    '1.0',
    TRUE,
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0009-000000000008',
    'DISPUTED_PARCEL_COUNT',
    'Disputed Parcel Count',
    'Count of parcels recorded in disputed status under litigation or title challenge.',
    'STATUS_DISTRIBUTION',
    'COUNT',
    'COUNT',
    'LAND_RECORD',
    '1.0',
    TRUE,
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0009-000000000009',
    'PENDING_VERIFICATION_COUNT',
    'Pending Verification Parcel Count',
    'Count of cadastral records currently undergoing cadastral survey verification or revenue validation.',
    'STATUS_DISTRIBUTION',
    'COUNT',
    'COUNT',
    'LAND_RECORD',
    '1.0',
    TRUE,
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0009-000000000010',
    'INACTIVE_PARCEL_COUNT',
    'Inactive Parcel Count',
    'Count of amortized, consolidated, or deactivated historical parcel entries.',
    'STATUS_DISTRIBUTION',
    'COUNT',
    'COUNT',
    'LAND_RECORD',
    '1.0',
    TRUE,
    NOW(),
    NOW()
);
