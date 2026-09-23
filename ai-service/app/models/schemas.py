from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class IngestRequest(BaseModel):
    document_id: str = Field(..., description="UUID of the ResearchDocument to ingest")
    file_url: Optional[str] = Field(None, description="Direct URL to PDF or text file")
    source_url: Optional[str] = Field(None, description="Publication source URL")
    local_path: Optional[str] = Field(None, description="Optional local file path for prototype/testing")


class IngestResponse(BaseModel):
    document_id: str
    status: str
    chunk_count: int
    message: str


class ProcessingStatusResponse(BaseModel):
    id: Optional[str] = None
    research_document_id: str
    status: str
    error_message: Optional[str] = None
    chunk_count: int = 0
    content_hash: Optional[str] = None
    processing_version: str = "v1-bge-small"
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500, description="Semantic search query")
    top_k: int = Field(5, ge=1, le=20, description="Max number of evidence chunks (1 to 20)")
    only_published: bool = Field(True, description="Strictly restrict search to PUBLISHED documents")
    allowed_document_ids: Optional[list[str]] = Field(None, description="Optional document UUIDs scope")
    document_type: Optional[str] = Field(None, description="Filter by DocumentType enum")
    organization: Optional[str] = Field(None, description="Filter by organization substring")


class EvidenceItem(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    document_type: str
    authors: str
    organization: Optional[str] = None
    publication_date: Optional[date] = None
    text: str
    page_number: Optional[int] = None
    section_title: Optional[str] = None
    similarity: float
    source_url: Optional[str] = None
    citation: str
    linked_land_records_count: int = 0


class SearchResponse(BaseModel):
    query: str
    total_results: int
    search_duration_ms: int
    results: list[EvidenceItem]
