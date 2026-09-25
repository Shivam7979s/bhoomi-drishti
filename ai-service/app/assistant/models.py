from datetime import date
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class GroundingStatus(str, Enum):
    """
    Evidence grounding status classification.
    Explicitly communicates evidence support without pretending to provide statistical confidence.
    """
    GROUNDED = "GROUNDED"
    WEAK_EVIDENCE = "WEAK_EVIDENCE"
    NO_EVIDENCE = "NO_EVIDENCE"
    FALLBACK = "FALLBACK"


class EvidenceChunk(BaseModel):
    """
    Represents an authoritative retrieved document chunk with provenance metadata.
    """
    citation_index: int = Field(..., description="1-based ordinal index used for bracket citations [N]")
    chunk_id: str = Field(..., description="UUID of the document chunk")
    document_id: str = Field(..., description="UUID of the parent research document")
    document_title: str
    document_type: str
    authors: Optional[str] = None
    organization: Optional[str] = None
    publication_date: Optional[date] = None
    page_number: Optional[int] = None
    section_title: Optional[str] = None
    text: str
    similarity: float
    source_url: Optional[str] = None
    formatted_citation: str
    linked_land_records_count: int = 0


class Citation(BaseModel):
    """
    Authoritative citation bound to an actual retrieved chunk.
    The model never invents this metadata; it is assembled directly from PostgreSQL.
    """
    citation_index: int = Field(..., description="1-based ordinal index matching [N] in the answer")
    chunk_id: str
    document_id: str
    document_title: str
    document_type: str
    page_number: Optional[int] = None
    section_title: Optional[str] = None
    authors: Optional[str] = None
    organization: Optional[str] = None
    publication_date: Optional[date] = None
    source_url: Optional[str] = None
    similarity: float
    formatted_citation: str
    quote: str = Field(..., description="Verbatim excerpt from the chunk supporting the citation")


class AuthorizedContext(BaseModel):
    """
    Server-authorized platform context (governance indicator, snapshot, comparison,
    research document, or land record).
    """
    context_type: str = Field(..., description="Classification of context e.g. GOVERNANCE_INDICATOR")
    title: str = Field(..., description="Human-readable title or subject of the context")
    summary: str = Field(..., description="Server-assembled factual summary and metrics")
    metadata: Optional[dict] = Field(None, description="Structured non-sensitive attributes")


class AssistantQueryRequest(BaseModel):
    """
    Internal request payload for assistant retrieval and synthesis.
    """
    query: str = Field(..., min_length=2, max_length=500, description="User query for statutory assistance")
    top_k: int = Field(5, ge=1, le=20, description="Maximum number of evidence chunks to retrieve")
    only_published: bool = Field(True, description="Strictly restrict search to PUBLISHED documents")
    allowed_document_ids: Optional[list[str]] = Field(None, description="Optional UUIDs of allowed documents")
    document_type: Optional[str] = Field(None, description="Optional document type filter")
    organization: Optional[str] = Field(None, description="Optional organization filter")
    force_extractive: bool = Field(False, description="Force deterministic extractive fallback without LLM")
    context: Optional[AuthorizedContext] = Field(None, description="Server-authorized platform context")


class AssistantQueryResponse(BaseModel):
    """
    Structured evidence-grounded response.
    """
    query: str
    answer: str
    grounding_status: GroundingStatus
    citations: list[Citation]
    evidence: list[EvidenceChunk]
    retrieval_duration_ms: int
    synthesis_duration_ms: int
    total_duration_ms: int
    provider_used: str
    disclaimer: str
