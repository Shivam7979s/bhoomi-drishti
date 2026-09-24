import time
from fastapi import APIRouter
from app.config import settings
from app.embeddings.local_provider import local_embedding_provider
from app.db.vector_store import search_similar_chunks
from app.api.retrieval import format_citation
from app.assistant.models import (
    AssistantQueryRequest,
    AssistantQueryResponse,
    EvidenceChunk,
    GroundingStatus,
)
from app.assistant.provider import get_synthesis_provider, SynthesisProviderError
from app.assistant.extractive import ExtractiveFallbackProvider
from app.assistant.citation_validator import reconcile_citations

router = APIRouter(prefix="/internal/assistant", tags=["Internal Assistant"])

DISCLAIMER = (
    "This evidence-grounded response is synthesized from indexed statutory and research documents "
    "for informational purposes and does not constitute formal legal counsel, judicial rulings, "
    "or administrative title certification."
)


@router.post("/query", response_model=AssistantQueryResponse)
async def query_assistant(request: AssistantQueryRequest):
    """
    Executes end-to-end evidence retrieval, quality gate evaluation,
    pluggable synthesis, and authoritative citation reconciliation.
    """
    start_time = time.perf_counter()

    # 1. Generate 384-dimensional unit vector embedding for query
    query_vector = local_embedding_provider.embed_query(request.query)

    # 2. Query vector store in PostgreSQL
    rows = await search_similar_chunks(
        query_vector=query_vector,
        top_k=request.top_k,
        only_published=request.only_published,
        allowed_document_ids=request.allowed_document_ids,
        document_type=request.document_type,
        organization=request.organization,
    )

    retrieval_duration_ms = int((time.perf_counter() - start_time) * 1000)

    # 3. Assemble EvidenceChunk models with 1-based citation indices
    evidence_items: list[EvidenceChunk] = []
    for idx, row in enumerate(rows, start=1):
        raw_pub_date = row.get("publication_date")
        pub_date = raw_pub_date
        if isinstance(raw_pub_date, str):
            try:
                from datetime import date
                pub_date = date.fromisoformat(raw_pub_date)
            except Exception:
                pub_date = None

        citation_str = format_citation(
            authors=row.get("authors") or "Unknown",
            pub_date=pub_date,
            title=row.get("document_title") or "Document",
            page_number=row.get("page_number"),
        )
        evidence_items.append(
            EvidenceChunk(
                citation_index=idx,
                chunk_id=str(row["chunk_id"]),
                document_id=str(row["document_id"]),
                document_title=row.get("document_title") or "",
                document_type=row.get("document_type") or "",
                authors=row.get("authors"),
                organization=row.get("organization"),
                publication_date=pub_date,
                page_number=row.get("page_number"),
                section_title=row.get("section_title"),
                text=row["text"],
                similarity=round(float(row.get("similarity", 0.0)), 4),
                source_url=row.get("source_url"),
                formatted_citation=citation_str,
                linked_land_records_count=int(row.get("linked_land_records_count", 0)),
            )
        )

    # 4. Evidence Quality Gate Evaluation
    if not evidence_items:
        total_duration_ms = int((time.perf_counter() - start_time) * 1000)
        return AssistantQueryResponse(
            query=request.query,
            answer="The available statutory and research documents in BHOOMI-DRISHTI do not contain sufficient evidence to answer this question.",
            grounding_status=GroundingStatus.NO_EVIDENCE,
            citations=[],
            evidence=[],
            retrieval_duration_ms=retrieval_duration_ms,
            synthesis_duration_ms=0,
            total_duration_ms=total_duration_ms,
            provider_used="none",
            disclaimer=DISCLAIMER,
        )

    max_similarity = max(e.similarity for e in evidence_items)
    if max_similarity < settings.evidence_gate_min_similarity:
        total_duration_ms = int((time.perf_counter() - start_time) * 1000)
        return AssistantQueryResponse(
            query=request.query,
            answer="The available statutory and research documents in BHOOMI-DRISHTI do not contain sufficient evidence to answer this question.",
            grounding_status=GroundingStatus.NO_EVIDENCE,
            citations=[],
            evidence=evidence_items,
            retrieval_duration_ms=retrieval_duration_ms,
            synthesis_duration_ms=0,
            total_duration_ms=total_duration_ms,
            provider_used="evidence_gate",
            disclaimer=DISCLAIMER,
        )

    grounding_status = (
        GroundingStatus.WEAK_EVIDENCE
        if max_similarity < settings.evidence_gate_sufficient_similarity
        else GroundingStatus.GROUNDED
    )

    # 5. Synthesis (with graceful deterministic fallback on failure or timeout)
    synth_start = time.perf_counter()

    if grounding_status == GroundingStatus.WEAK_EVIDENCE:
        # Hardening safeguard: When evidence is weak or partial, do not allow generative LLMs
        # to extrapolate unsupported legal/statutory conclusions. Instead, prefer deterministic
        # authoritative excerpts with explicit insufficiency cautionary language.
        fallback_provider = ExtractiveFallbackProvider()
        excerpts_answer, _, provider_used = await fallback_provider.synthesize(request.query, evidence_items)
        raw_answer = (
            "Caution: The retrieved evidence is only partially or weakly relevant to this query. "
            "To prevent unsupported statutory interpretations, relevant excerpts are provided below:\n\n"
            + excerpts_answer
        )
    else:
        provider = get_synthesis_provider(force_extractive=request.force_extractive)
        try:
            raw_answer, _, provider_used = await provider.synthesize(request.query, evidence_items)
        except (SynthesisProviderError, Exception):
            # Fall back gracefully to ExtractiveFallbackProvider
            fallback_provider = ExtractiveFallbackProvider()
            raw_answer, _, provider_used = await fallback_provider.synthesize(request.query, evidence_items)
            grounding_status = GroundingStatus.FALLBACK

    synthesis_duration_ms = int((time.perf_counter() - synth_start) * 1000)

    # 6. Reconcile and validate citations
    cleaned_answer, citations = reconcile_citations(raw_answer, evidence_items)

    total_duration_ms = int((time.perf_counter() - start_time) * 1000)

    return AssistantQueryResponse(
        query=request.query,
        answer=cleaned_answer,
        grounding_status=grounding_status,
        citations=citations,
        evidence=evidence_items,
        retrieval_duration_ms=retrieval_duration_ms,
        synthesis_duration_ms=synthesis_duration_ms,
        total_duration_ms=total_duration_ms,
        provider_used=provider_used,
        disclaimer=DISCLAIMER,
    )
