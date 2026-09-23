from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.models.schemas import IngestRequest, IngestResponse, ProcessingStatusResponse
from app.ingestion.pipeline import ingestion_pipeline
from app.db.vector_store import get_processing_record, upsert_processing_status

router = APIRouter(prefix="/internal", tags=["Internal Ingestion"])


@router.post("/ingest", response_model=IngestResponse)
async def ingest_document(
    request: IngestRequest,
    background_tasks: BackgroundTasks,
):
    """
    Queues a document for extraction, chunking, and vector embedding.
    Prevents concurrent duplicate ingestion runs.
    """
    # Check if document is already processing
    existing = await get_processing_record(request.document_id)
    if existing and existing.get("status") in ("QUEUED", "PROCESSING"):
        raise HTTPException(
            status_code=409,
            detail=f"Ingestion already in progress for document {request.document_id}.",
        )

    # Immediately set status to QUEUED in database
    await upsert_processing_status(document_id=request.document_id, status="QUEUED")

    # Dispatch ingestion execution in background task
    background_tasks.add_task(
        ingestion_pipeline.ingest_document,
        document_id=request.document_id,
        file_url=request.file_url,
        source_url=request.source_url,
        local_path=request.local_path,
    )

    return IngestResponse(
        document_id=request.document_id,
        status="QUEUED",
        chunk_count=0,
        message="Document ingestion successfully queued for processing.",
    )


@router.get("/status/{document_id}", response_model=ProcessingStatusResponse)
async def get_status(document_id: str):
    """Returns the current ingestion status for a research document."""
    record = await get_processing_record(document_id)
    if not record:
        return ProcessingStatusResponse(
            research_document_id=document_id,
            status="NOT_INGESTED",
            chunk_count=0,
        )

    return ProcessingStatusResponse(
        id=str(record["id"]),
        research_document_id=str(record["research_document_id"]),
        status=record["status"],
        error_message=record.get("error_message"),
        chunk_count=record.get("chunk_count", 0),
        content_hash=record.get("content_hash"),
        processing_version=record.get("processing_version", "v1-bge-small"),
        started_at=record.get("started_at"),
        completed_at=record.get("completed_at"),
    )
