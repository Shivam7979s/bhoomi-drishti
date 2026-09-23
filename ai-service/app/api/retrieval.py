import time
from fastapi import APIRouter
from app.models.schemas import SearchRequest, SearchResponse, EvidenceItem
from app.embeddings.local_provider import local_embedding_provider
from app.db.vector_store import search_similar_chunks

router = APIRouter(prefix="/internal", tags=["Internal Semantic Search"])


def format_citation(authors: str, pub_date, title: str, page_number: int | None) -> str:
    """Formats standardized evidence citation string."""
    year = pub_date.year if pub_date else "n.d."
    page_part = f", p. {page_number}" if page_number is not None else ""
    return f"{authors} ({year}). {title}{page_part}"


@router.post("/search", response_model=SearchResponse)
async def semantic_search(request: SearchRequest):
    """
    Executes semantic vector search:
    1. Embeds query using FastEmbed (BAAI/bge-small-en-v1.5, 384 dimensions).
    2. Searches document_chunks using HNSW cosine similarity.
    3. Enforces publication rules and metadata filters.
    4. Attaches verbatim evidence, page numbers, and formal citation tuples.
    """
    start_time = time.perf_counter()

    # Generate 384-dimensional unit vector embedding for query
    query_vector = local_embedding_provider.embed_query(request.query)

    # Query vector store in PostgreSQL
    rows = await search_similar_chunks(
        query_vector=query_vector,
        top_k=request.top_k,
        only_published=request.only_published,
        allowed_document_ids=request.allowed_document_ids,
        document_type=request.document_type,
        organization=request.organization,
    )

    duration_ms = int((time.perf_counter() - start_time) * 1000)

    evidence_items = []
    for row in rows:
        citation = format_citation(
            authors=row.get("authors", "Unknown"),
            pub_date=row.get("publication_date"),
            title=row.get("document_title", "Document"),
            page_number=row.get("page_number"),
        )

        evidence_items.append(
            EvidenceItem(
                chunk_id=str(row["chunk_id"]),
                document_id=str(row["document_id"]),
                document_title=row.get("document_title", ""),
                document_type=row.get("document_type", ""),
                authors=row.get("authors", ""),
                organization=row.get("organization"),
                publication_date=row.get("publication_date"),
                text=row["text"],
                page_number=row.get("page_number"),
                section_title=row.get("section_title"),
                similarity=round(float(row.get("similarity", 0.0)), 4),
                source_url=row.get("source_url"),
                citation=citation,
                linked_land_records_count=int(row.get("linked_land_records_count", 0)),
            )
        )

    return SearchResponse(
        query=request.query,
        total_results=len(evidence_items),
        search_duration_ms=duration_ms,
        results=evidence_items,
    )
