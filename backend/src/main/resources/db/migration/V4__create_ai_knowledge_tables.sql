-- ---------------------------------------------------------------------------
-- BHOOMI-DRISHTI - Phase 5: AI Knowledge & Evidence Layer
--
-- Enables pgvector extension, creates document_processing status tracking,
-- and creates document_chunks table with 384-dimensional vector embeddings
-- (BAAI/bge-small-en-v1.5) and an HNSW cosine similarity index.
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS vector;

-- Ingestion state machine and diagnostics for research documents
CREATE TABLE document_processing
(
    id                   UUID         NOT NULL,
    research_document_id UUID         NOT NULL,
    status               VARCHAR(32)  NOT NULL DEFAULT 'NOT_INGESTED',
    error_message        TEXT,
    chunk_count          INTEGER      NOT NULL DEFAULT 0,
    content_hash         VARCHAR(64),
    processing_version   VARCHAR(32)  NOT NULL DEFAULT 'v1-bge-small',
    started_at           TIMESTAMPTZ,
    completed_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ  NOT NULL,
    updated_at           TIMESTAMPTZ  NOT NULL,
    CONSTRAINT pk_document_processing PRIMARY KEY (id),
    CONSTRAINT uq_doc_proc_research_doc UNIQUE (research_document_id),
    CONSTRAINT fk_doc_proc_research_doc FOREIGN KEY (research_document_id)
        REFERENCES research_documents (id) ON DELETE CASCADE,
    CONSTRAINT ck_doc_proc_status CHECK (status IN
        ('NOT_INGESTED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX idx_doc_proc_status ON document_processing (status);

-- Deterministic text chunks preserving document and page provenance with vector embeddings
CREATE TABLE document_chunks
(
    id                   UUID         NOT NULL,
    research_document_id UUID         NOT NULL,
    chunk_index          INTEGER      NOT NULL,
    text                 TEXT         NOT NULL,
    page_number          INTEGER,
    section_title        VARCHAR(255),
    token_count          INTEGER,
    content_hash         VARCHAR(64),
    embedding            vector(384)  NOT NULL,
    created_at           TIMESTAMPTZ  NOT NULL,
    CONSTRAINT pk_document_chunks PRIMARY KEY (id),
    CONSTRAINT fk_document_chunks_research_doc FOREIGN KEY (research_document_id)
        REFERENCES research_documents (id) ON DELETE CASCADE
);

CREATE INDEX idx_doc_chunks_doc_id ON document_chunks (research_document_id);
CREATE INDEX idx_doc_chunks_doc_index ON document_chunks (research_document_id, chunk_index);

-- HNSW Vector Index for sub-millisecond Cosine Similarity search
CREATE INDEX idx_document_chunks_embedding
    ON document_chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
