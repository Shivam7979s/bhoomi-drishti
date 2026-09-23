-- ---------------------------------------------------------------------------
-- BHOOMI-DRISHTI - Phase 4: Research Hub table and land record join table.
--
-- Schema for research papers, policy documents, government reports,
-- academic publications, datasets, case studies, legal documents, and
-- evidence linked to land governance and parcels.
-- ---------------------------------------------------------------------------

CREATE TABLE research_documents
(
    id               UUID          NOT NULL,
    title            VARCHAR(255)  NOT NULL,
    description      TEXT          NOT NULL,
    document_type    VARCHAR(32)   NOT NULL,
    authors          VARCHAR(255)  NOT NULL,
    organization     VARCHAR(255),
    publication_date DATE,
    source_url       VARCHAR(1024),
    file_url         VARCHAR(1024),
    language         VARCHAR(32)   NOT NULL DEFAULT 'en',
    keywords         VARCHAR(512),
    abstract_text    TEXT,
    status           VARCHAR(32)   NOT NULL DEFAULT 'DRAFT',
    created_by       UUID,
    created_at       TIMESTAMPTZ   NOT NULL,
    updated_at       TIMESTAMPTZ   NOT NULL,
    CONSTRAINT pk_research_documents PRIMARY KEY (id),
    CONSTRAINT fk_research_documents_created_by FOREIGN KEY (created_by)
        REFERENCES app_user (id) ON DELETE SET NULL,
    CONSTRAINT ck_research_documents_type CHECK (document_type IN
        ('RESEARCH_PAPER', 'POLICY_DOCUMENT', 'GOVERNMENT_REPORT', 'ACADEMIC_PUBLICATION',
         'DATASET', 'CASE_STUDY', 'LEGAL_DOCUMENT', 'OTHER')),
    CONSTRAINT ck_research_documents_status CHECK (status IN
        ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);

CREATE INDEX idx_research_docs_type ON research_documents (document_type);
CREATE INDEX idx_research_docs_status ON research_documents (status);
CREATE INDEX idx_research_docs_pub_date ON research_documents (publication_date);
CREATE INDEX idx_research_docs_org ON research_documents (organization);
CREATE INDEX idx_research_docs_created_by ON research_documents (created_by);

-- Many-to-many join table between research documents and land parcels
CREATE TABLE research_document_land_records
(
    research_document_id UUID NOT NULL,
    land_record_id       UUID NOT NULL,
    CONSTRAINT pk_research_doc_land_rec PRIMARY KEY (research_document_id, land_record_id),
    CONSTRAINT fk_rdlr_research_doc FOREIGN KEY (research_document_id)
        REFERENCES research_documents (id) ON DELETE CASCADE,
    CONSTRAINT fk_rdlr_land_rec FOREIGN KEY (land_record_id)
        REFERENCES land_records (id) ON DELETE CASCADE
);

CREATE INDEX idx_rdlr_land_record ON research_document_land_records (land_record_id);
