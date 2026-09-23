from datetime import datetime, timezone
from typing import Any, Optional
import uuid
from app.db.session import get_db_pool
from app.chunking.models import Chunk


async def get_processing_record(document_id: str) -> Optional[dict[str, Any]]:
    """Retrieves document processing status row for a research document."""
    pool = await get_db_pool()
    query = """
        SELECT id, research_document_id, status, error_message, chunk_count,
               content_hash, processing_version, started_at, completed_at,
               created_at, updated_at
        FROM document_processing
        WHERE research_document_id = $1::uuid
    """
    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, document_id)
        if row:
            return dict(row)
        return None


async def upsert_processing_status(
    document_id: str,
    status: str,
    error_message: Optional[str] = None,
    chunk_count: int = 0,
    content_hash: Optional[str] = None,
) -> dict[str, Any]:
    """Upserts document_processing status in PostgreSQL."""
    pool = await get_db_pool()
    now = datetime.now(timezone.utc)

    query = """
        INSERT INTO document_processing (
            id, research_document_id, status, error_message, chunk_count,
            content_hash, processing_version, started_at, completed_at,
            created_at, updated_at
        ) VALUES (
            $1, $2::uuid, $3::varchar, $4, $5, $6, 'v1-bge-small',
            CASE WHEN $3::varchar = 'PROCESSING' THEN $7::timestamptz ELSE NULL END,
            CASE WHEN $3::varchar IN ('COMPLETED', 'FAILED') THEN $7::timestamptz ELSE NULL END,
            $7::timestamptz, $7::timestamptz
        )
        ON CONFLICT (research_document_id) DO UPDATE SET
            status = EXCLUDED.status,
            error_message = EXCLUDED.error_message,
            chunk_count = CASE WHEN EXCLUDED.status = 'COMPLETED' THEN EXCLUDED.chunk_count ELSE document_processing.chunk_count END,
            content_hash = COALESCE(EXCLUDED.content_hash, document_processing.content_hash),
            started_at = CASE WHEN EXCLUDED.status = 'PROCESSING' THEN $7::timestamptz ELSE document_processing.started_at END,
            completed_at = CASE WHEN EXCLUDED.status IN ('COMPLETED', 'FAILED') THEN $7::timestamptz ELSE NULL END,
            updated_at = $7::timestamptz
        RETURNING *
    """
    async with pool.acquire() as conn:
        record_id = uuid.uuid4()
        row = await conn.fetchrow(
            query,
            record_id,
            document_id,
            status,
            error_message,
            chunk_count,
            content_hash,
            now,
        )
        return dict(row)


async def atomic_save_chunks(
    document_id: str,
    chunks: list[Chunk],
    embeddings: list[list[float]],
) -> int:
    """
    Atomically clears previous chunks for a document and inserts new chunks with vector embeddings.
    Runs inside a single database transaction.
    """
    pool = await get_db_pool()
    now = datetime.now(timezone.utc)

    records = []
    for chunk, emb in zip(chunks, embeddings):
        records.append((
            uuid.uuid4(),
            uuid.UUID(document_id),
            chunk.chunk_index,
            chunk.text,
            chunk.page_number,
            chunk.section_title,
            chunk.token_count,
            chunk.content_hash,
            emb,
            now,
        ))

    async with pool.acquire() as conn:
        async with conn.transaction():
            # 1. Delete old chunks for this document
            await conn.execute(
                "DELETE FROM document_chunks WHERE research_document_id = $1::uuid",
                document_id,
            )

            # 2. Insert new chunks with vector embeddings
            if records:
                insert_query = """
                    INSERT INTO document_chunks (
                        id, research_document_id, chunk_index, text,
                        page_number, section_title, token_count,
                        content_hash, embedding, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                """
                await conn.executemany(insert_query, records)

    return len(records)


async def search_similar_chunks(
    query_vector: list[float],
    top_k: int = 5,
    only_published: bool = True,
    allowed_document_ids: Optional[list[str]] = None,
    document_type: Optional[str] = None,
    organization: Optional[str] = None,
) -> list[dict[str, Any]]:
    """
    Executes cosine vector similarity search on document_chunks joined with research_documents.
    Enforces publication status and metadata filters.
    """
    pool = await get_db_pool()

    conditions = []
    params: list[Any] = [query_vector]
    p_idx = 2

    # Public visibility: only chunks from PUBLISHED research documents
    if only_published:
        conditions.append("rd.status = 'PUBLISHED'")

    # Optional document ID filter (e.g. for researcher inspecting own drafts)
    if allowed_document_ids:
        doc_uuids = [uuid.UUID(d) for d in allowed_document_ids]
        conditions.append(f"c.research_document_id = ANY(${p_idx}::uuid[])")
        params.append(doc_uuids)
        p_idx += 1

    # Optional metadata filters
    if document_type:
        conditions.append(f"rd.document_type = ${p_idx}")
        params.append(document_type)
        p_idx += 1

    if organization:
        conditions.append(f"rd.organization ILIKE ${p_idx}")
        params.append(f"%{organization}%")
        p_idx += 1

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    # Cosine similarity in pgvector: 1 - (embedding <=> query_vector)
    query = f"""
        SELECT
            c.id AS chunk_id,
            c.research_document_id AS document_id,
            c.chunk_index,
            c.text,
            c.page_number,
            c.section_title,
            c.token_count,
            (1 - (c.embedding <=> $1)) AS similarity,
            rd.title AS document_title,
            rd.document_type,
            rd.authors,
            rd.organization,
            rd.publication_date,
            rd.source_url,
            (
                SELECT COUNT(*)
                FROM research_document_land_records rdlr
                WHERE rdlr.research_document_id = rd.id
            ) AS linked_land_records_count
        FROM document_chunks c
        JOIN research_documents rd ON c.research_document_id = rd.id
        {where_clause}
        ORDER BY c.embedding <=> $1 ASC
        LIMIT ${p_idx}
    """
    params.append(top_k)

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
        return [dict(r) for r in rows]
