-- ---------------------------------------------------------------------------
-- BHOOMI-DRISHTI - Phase 3: land record table with PostGIS boundary geometry.
--
-- Prototype data only: no real government land records, no real personal
-- identifiers. parcel_number is deliberately NOT globally unique - this
-- prototype does not assume any government uniqueness rules.
--
-- boundary uses PostGIS geometry(Geometry, 4326): the typmod enforces SRID
-- 4326, the CHECK constraints restrict shapes to POLYGON/MULTIPOLYGON.
-- ---------------------------------------------------------------------------

-- Enable PostGIS and uuid-ossp extensions (idempotent - safe to run multiple times).
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE land_records
(
    id                  UUID            NOT NULL,
    parcel_number       VARCHAR(64)     NOT NULL,
    survey_number       VARCHAR(64),
    state               VARCHAR(100)    NOT NULL,
    district            VARCHAR(100)    NOT NULL,
    tehsil              VARCHAR(100)    NOT NULL,
    village             VARCHAR(100)    NOT NULL,
    land_area_sq_meters NUMERIC(14, 2)  NOT NULL,
    land_use_type       VARCHAR(32)     NOT NULL,
    ownership_type      VARCHAR(32)     NOT NULL,
    owner_name          VARCHAR(120)    NOT NULL,
    -- Non-sensitive prototype placeholder - never a real government identifier.
    owner_identifier    VARCHAR(64),
    status              VARCHAR(32)     NOT NULL,
    boundary            geometry(Geometry, 4326) NOT NULL,
    created_at          TIMESTAMPTZ     NOT NULL,
    updated_at          TIMESTAMPTZ     NOT NULL,
    CONSTRAINT pk_land_records PRIMARY KEY (id),
    CONSTRAINT ck_land_records_area_positive CHECK (land_area_sq_meters > 0),
    CONSTRAINT ck_land_records_land_use CHECK (land_use_type IN
        ('AGRICULTURAL', 'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'GOVERNMENT', 'FOREST', 'OTHER')),
    CONSTRAINT ck_land_records_ownership CHECK (ownership_type IN
        ('INDIVIDUAL', 'JOINT', 'GOVERNMENT', 'COMMUNITY', 'OTHER')),
    CONSTRAINT ck_land_records_status CHECK (status IN
        ('ACTIVE', 'INACTIVE', 'DISPUTED', 'PENDING_VERIFICATION')),
    CONSTRAINT ck_land_records_boundary_shape CHECK
        (ST_GeometryType(boundary) IN ('ST_Polygon', 'ST_MultiPolygon')),
    CONSTRAINT ck_land_records_boundary_srid CHECK (ST_SRID(boundary) = 4326)
);

-- Filter combinations (state + district + tehsil + village are the main path).
CREATE INDEX idx_land_records_location ON land_records (state, district, tehsil, village);
CREATE INDEX idx_land_records_parcel_number ON land_records (parcel_number);
CREATE INDEX idx_land_records_status ON land_records (status);
CREATE INDEX idx_land_records_land_use_type ON land_records (land_use_type);

-- Spatial index powering ST_Intersects / ST_Contains queries (required).
CREATE INDEX idx_land_records_boundary ON land_records USING GIST (boundary);
