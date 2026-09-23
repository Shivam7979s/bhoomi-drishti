-- ---------------------------------------------------------------------------
-- BHOOMI-DRISHTI - Phase 7: Collaboration & Research Workspace Layer
--
-- Schema for institutional Workspaces, multi-user Projects, Project Memberships,
-- 1-level Threaded Comments, Saved Research curation, Shared Datasets catalog,
-- and linkages to existing PostGIS Land Records and Research Documents.
-- ---------------------------------------------------------------------------

-- 1. Workspaces
CREATE TABLE workspaces
(
    id          UUID         NOT NULL,
    name        VARCHAR(120) NOT NULL,
    slug        VARCHAR(140) NOT NULL,
    description TEXT,
    institution VARCHAR(180),
    visibility  VARCHAR(32)  NOT NULL DEFAULT 'PRIVATE',
    status      VARCHAR(32)  NOT NULL DEFAULT 'ACTIVE',
    created_by  UUID         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL,
    CONSTRAINT pk_workspaces PRIMARY KEY (id),
    CONSTRAINT uq_workspaces_slug UNIQUE (slug),
    CONSTRAINT fk_workspaces_created_by FOREIGN KEY (created_by)
        REFERENCES app_user (id) ON DELETE RESTRICT,
    CONSTRAINT ck_workspaces_visibility CHECK (visibility IN ('PRIVATE', 'WORKSPACE_MEMBERS', 'PUBLIC')),
    CONSTRAINT ck_workspaces_status CHECK (status IN ('ACTIVE', 'ARCHIVED'))
);

CREATE INDEX idx_workspaces_slug ON workspaces (slug);
CREATE INDEX idx_workspaces_created_by ON workspaces (created_by);
CREATE INDEX idx_workspaces_status ON workspaces (status);
CREATE INDEX idx_workspaces_visibility ON workspaces (visibility);

-- 2. Workspace Members (Single OWNER invariant enforced in service + unique constraint)
CREATE TABLE workspace_members
(
    id           UUID        NOT NULL,
    workspace_id UUID        NOT NULL,
    user_id      UUID        NOT NULL,
    role         VARCHAR(32) NOT NULL DEFAULT 'MEMBER',
    joined_at    TIMESTAMPTZ NOT NULL,
    CONSTRAINT pk_workspace_members PRIMARY KEY (id),
    CONSTRAINT uq_workspace_member UNIQUE (workspace_id, user_id),
    CONSTRAINT fk_ws_members_workspace FOREIGN KEY (workspace_id)
        REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT fk_ws_members_user FOREIGN KEY (user_id)
        REFERENCES app_user (id) ON DELETE CASCADE,
    CONSTRAINT ck_ws_members_role CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER'))
);

CREATE INDEX idx_ws_members_user ON workspace_members (user_id);
CREATE INDEX idx_ws_members_ws_role ON workspace_members (workspace_id, role);

-- 3. Projects
CREATE TABLE projects
(
    id           UUID         NOT NULL,
    workspace_id UUID         NOT NULL,
    name         VARCHAR(200) NOT NULL,
    slug         VARCHAR(220) NOT NULL,
    description  TEXT,
    status       VARCHAR(32)  NOT NULL DEFAULT 'ACTIVE',
    visibility   VARCHAR(32)  NOT NULL DEFAULT 'WORKSPACE_INHERITED',
    created_by   UUID         NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL,
    updated_at   TIMESTAMPTZ  NOT NULL,
    CONSTRAINT pk_projects PRIMARY KEY (id),
    CONSTRAINT uq_projects_workspace_slug UNIQUE (workspace_id, slug),
    CONSTRAINT fk_projects_workspace FOREIGN KEY (workspace_id)
        REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by)
        REFERENCES app_user (id) ON DELETE RESTRICT,
    CONSTRAINT ck_projects_status CHECK (status IN ('ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED')),
    CONSTRAINT ck_projects_visibility CHECK (visibility IN ('WORKSPACE_INHERITED', 'PRIVATE_TO_PROJECT_MEMBERS', 'PUBLIC'))
);

CREATE INDEX idx_projects_workspace ON projects (workspace_id);
CREATE INDEX idx_projects_status ON projects (status);
CREATE INDEX idx_projects_created_by ON projects (created_by);

-- 4. Project Members (Must belong to parent workspace)
CREATE TABLE project_members
(
    id           UUID        NOT NULL,
    project_id   UUID        NOT NULL,
    user_id      UUID        NOT NULL,
    project_role VARCHAR(32) NOT NULL DEFAULT 'CONTRIBUTOR',
    assigned_at  TIMESTAMPTZ NOT NULL,
    CONSTRAINT pk_project_members PRIMARY KEY (id),
    CONSTRAINT uq_project_member UNIQUE (project_id, user_id),
    CONSTRAINT fk_pm_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_pm_user FOREIGN KEY (user_id)
        REFERENCES app_user (id) ON DELETE CASCADE,
    CONSTRAINT ck_pm_role CHECK (project_role IN ('LEAD', 'CONTRIBUTOR', 'VIEWER'))
);

CREATE INDEX idx_pm_project ON project_members (project_id);
CREATE INDEX idx_pm_user ON project_members (user_id);

-- 5. Threaded Comments (Strict max 1 reply level)
CREATE TABLE project_comments
(
    id                UUID        NOT NULL,
    project_id        UUID        NOT NULL,
    user_id           UUID        NOT NULL,
    parent_comment_id UUID,
    content           TEXT        NOT NULL,
    is_edited         BOOLEAN     NOT NULL DEFAULT FALSE,
    is_pinned         BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL,
    updated_at        TIMESTAMPTZ NOT NULL,
    CONSTRAINT pk_project_comments PRIMARY KEY (id),
    CONSTRAINT fk_comments_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id)
        REFERENCES app_user (id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_parent FOREIGN KEY (parent_comment_id)
        REFERENCES project_comments (id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_project ON project_comments (project_id);
CREATE INDEX idx_comments_user ON project_comments (user_id);
CREATE INDEX idx_comments_parent ON project_comments (parent_comment_id);

-- 6. Saved Research (Cascades on target delete; requires non-empty target)
CREATE TABLE saved_research
(
    id                   UUID         NOT NULL,
    user_id              UUID         NOT NULL,
    research_document_id UUID,
    document_chunk_id    UUID,
    title                VARCHAR(255) NOT NULL,
    notes                TEXT,
    tags                 VARCHAR(255),
    created_at           TIMESTAMPTZ  NOT NULL,
    CONSTRAINT pk_saved_research PRIMARY KEY (id),
    CONSTRAINT fk_sr_user FOREIGN KEY (user_id)
        REFERENCES app_user (id) ON DELETE CASCADE,
    CONSTRAINT fk_sr_document FOREIGN KEY (research_document_id)
        REFERENCES research_documents (id) ON DELETE CASCADE,
    CONSTRAINT fk_sr_chunk FOREIGN KEY (document_chunk_id)
        REFERENCES document_chunks (id) ON DELETE CASCADE,
    CONSTRAINT ck_saved_research_not_empty CHECK (
        research_document_id IS NOT NULL OR document_chunk_id IS NOT NULL
    )
);

CREATE INDEX idx_saved_research_user ON saved_research (user_id);
CREATE INDEX idx_saved_research_doc ON saved_research (research_document_id);

-- 7. Shared Datasets Metadata Catalog
CREATE TABLE shared_datasets
(
    id                UUID          NOT NULL,
    workspace_id      UUID          NOT NULL,
    title             VARCHAR(255)  NOT NULL,
    description       TEXT          NOT NULL,
    format            VARCHAR(32)   NOT NULL,
    source_url        VARCHAR(1024),
    spatial_coverage  VARCHAR(255),
    temporal_coverage VARCHAR(100),
    license           VARCHAR(100),
    record_count      BIGINT,
    file_size_bytes   BIGINT,
    created_by        UUID,
    created_at        TIMESTAMPTZ   NOT NULL,
    updated_at        TIMESTAMPTZ   NOT NULL,
    CONSTRAINT pk_shared_datasets PRIMARY KEY (id),
    CONSTRAINT fk_datasets_workspace FOREIGN KEY (workspace_id)
        REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT fk_datasets_created_by FOREIGN KEY (created_by)
        REFERENCES app_user (id) ON DELETE SET NULL,
    CONSTRAINT ck_datasets_format CHECK (format IN
        ('GEOJSON', 'SHAPEFILE', 'CSV', 'GEOTIFF', 'KML', 'API_ENDPOINT', 'OTHER'))
);

CREATE INDEX idx_datasets_workspace ON shared_datasets (workspace_id);
CREATE INDEX idx_datasets_format ON shared_datasets (format);

-- 8. Project ↔ Land Records Join Table
CREATE TABLE project_land_records
(
    project_id     UUID        NOT NULL,
    land_record_id UUID        NOT NULL,
    context_notes  TEXT,
    added_by       UUID,
    added_at       TIMESTAMPTZ NOT NULL,
    CONSTRAINT pk_project_land_records PRIMARY KEY (project_id, land_record_id),
    CONSTRAINT fk_plr_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_plr_land_record FOREIGN KEY (land_record_id)
        REFERENCES land_records (id) ON DELETE CASCADE,
    CONSTRAINT fk_plr_added_by FOREIGN KEY (added_by)
        REFERENCES app_user (id) ON DELETE SET NULL
);

CREATE INDEX idx_plr_land_record ON project_land_records (land_record_id);

-- 9. Project ↔ Research Documents Join Table
CREATE TABLE project_research_documents
(
    project_id           UUID        NOT NULL,
    research_document_id UUID        NOT NULL,
    relevance_notes      TEXT,
    added_by             UUID,
    added_at             TIMESTAMPTZ NOT NULL,
    CONSTRAINT pk_project_research_docs PRIMARY KEY (project_id, research_document_id),
    CONSTRAINT fk_prd_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_prd_document FOREIGN KEY (research_document_id)
        REFERENCES research_documents (id) ON DELETE CASCADE,
    CONSTRAINT fk_prd_added_by FOREIGN KEY (added_by)
        REFERENCES app_user (id) ON DELETE SET NULL
);

CREATE INDEX idx_prd_document ON project_research_documents (research_document_id);

-- 10. Project ↔ Shared Datasets Join Table
CREATE TABLE project_shared_datasets
(
    project_id        UUID        NOT NULL,
    shared_dataset_id UUID        NOT NULL,
    added_at          TIMESTAMPTZ NOT NULL,
    CONSTRAINT pk_project_datasets PRIMARY KEY (project_id, shared_dataset_id),
    CONSTRAINT fk_pds_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_pds_dataset FOREIGN KEY (shared_dataset_id)
        REFERENCES shared_datasets (id) ON DELETE CASCADE
);
