import hashlib
import logging
from pathlib import Path
from typing import Optional
from app.config import settings
from app.extraction.ssrf_guard import safe_download_document
from app.extraction.pdf_extractor import extract_text_from_pdf, ScannedPdfError, ExtractionError
from app.extraction.text_extractor import extract_text_from_plain_text
from app.chunking.chunker import DeterministicChunker
from app.embeddings.local_provider import local_embedding_provider
from app.db.vector_store import upsert_processing_status, atomic_save_chunks

logger = logging.getLogger(__name__)


class IngestionPipeline:
    """
    Orchestrates:
    Source Resolution -> Fetch (SSRF-safe) -> Extraction -> Chunking -> FastEmbed (384) -> Atomic Vector Store
    """

    def __init__(self):
        self.chunker = DeterministicChunker(target_size=600, overlap=100, min_size=100)

    async def ingest_document(
        self,
        document_id: str,
        file_url: Optional[str] = None,
        source_url: Optional[str] = None,
        local_path: Optional[str] = None,
    ) -> tuple[str, int, str]:
        """
        Executes document ingestion lifecycle.
        Updates document_processing status at each stage.
        Returns (status, chunk_count, message).
        """
        logger.info(f"Commencing ingestion for ResearchDocument {document_id}")
        await upsert_processing_status(document_id=document_id, status="PROCESSING")

        try:
            # 1. Deterministic Source Selection (precedence: local_path -> file_url -> source_url)
            doc_bytes, source_label = await self._resolve_and_fetch_source(
                document_id=document_id,
                file_url=file_url,
                source_url=source_url,
                local_path=local_path,
            )

            # 2. Format detection & text extraction
            pages = self._extract_pages(doc_bytes, source_label)

            # 3. Deterministic chunking
            chunks = self.chunker.chunk_pages(pages)
            if not chunks:
                raise ExtractionError("Chunker produced 0 valid chunks from document text.")

            # 4. Generate embeddings via FastEmbed (BAAI/bge-small-en-v1.5, 384 dims)
            chunk_texts = [c.text for c in chunks]
            embeddings = local_embedding_provider.embed_texts(chunk_texts)

            # 5. Atomically save chunks and vector embeddings in PostgreSQL
            saved_count = await atomic_save_chunks(
                document_id=document_id,
                chunks=chunks,
                embeddings=embeddings,
            )

            # 6. Compute overall content SHA-256 hash
            content_hash = hashlib.sha256(doc_bytes).hexdigest()

            # 7. Update status to COMPLETED
            await upsert_processing_status(
                document_id=document_id,
                status="COMPLETED",
                chunk_count=saved_count,
                content_hash=content_hash,
            )

            logger.info(
                f"Successfully ingested ResearchDocument {document_id}: "
                f"{saved_count} chunks embedded and indexed."
            )
            return "COMPLETED", saved_count, f"Successfully indexed {saved_count} chunks."

        except ScannedPdfError as e:
            err_msg = str(e)
            logger.warning(f"Ingestion failed for {document_id}: {err_msg}")
            await upsert_processing_status(document_id=document_id, status="FAILED", error_message=err_msg)
            return "FAILED", 0, err_msg

        except Exception as e:
            err_msg = f"Ingestion error: {str(e)}"
            logger.error(f"Ingestion failed for {document_id}: {err_msg}", exc_info=True)
            # Sanitize error message to avoid leaking internal system details
            sanitized_err = str(e)[:300]
            await upsert_processing_status(document_id=document_id, status="FAILED", error_message=sanitized_err)
            return "FAILED", 0, sanitized_err

    async def _resolve_and_fetch_source(
        self,
        document_id: str,
        file_url: Optional[str],
        source_url: Optional[str],
        local_path: Optional[str],
    ) -> tuple[bytes, str]:
        """
        Resolves document source following strict precedence:
        1. Explicit local path or file placed in data_documents_dir
        2. fileUrl (direct document link)
        3. sourceUrl (if valid document link)
        """
        # Check local path or data_documents_dir
        if local_path:
            p = Path(local_path)
            if p.is_file():
                return p.read_bytes(), p.name

        for ext in ("", ".pdf", ".txt", ".md"):
            cand = Path(settings.data_documents_dir) / f"{document_id}{ext}"
            if cand.is_file():
                return cand.read_bytes(), cand.name

        if file_url:
            local_cand = Path(settings.data_documents_dir) / file_url.strip()
            if local_cand.is_file():
                return local_cand.read_bytes(), local_cand.name
            if Path(file_url.strip()).is_file():
                p = Path(file_url.strip())
                return p.read_bytes(), p.name

        # Precedence: file_url over source_url
        target_url = file_url.strip() if file_url and file_url.strip() else None
        if not target_url and source_url and source_url.strip():
            target_url = source_url.strip()

        if not target_url:
            raise ValueError(
                "No valid document source found: both fileUrl and sourceUrl are empty, "
                "and no local file was found."
            )

        # Download with strict SSRF defense
        doc_bytes = await safe_download_document(target_url)
        return doc_bytes, target_url

    def _extract_pages(self, doc_bytes: bytes, source_label: str) -> list[tuple[int, str]]:
        """Determines format and extracts text page-by-page."""
        # Check PDF magic bytes (%PDF)
        if doc_bytes.startswith(b"%PDF") or source_label.lower().endswith(".pdf"):
            return extract_text_from_pdf(doc_bytes)
        else:
            return extract_text_from_plain_text(doc_bytes)


ingestion_pipeline = IngestionPipeline()
