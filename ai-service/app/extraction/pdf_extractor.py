import io
import re
from pypdf import PdfReader


class ExtractionError(Exception):
    """Base error for document extraction failures."""
    pass


class ScannedPdfError(ExtractionError):
    """Raised when a PDF contains no or insufficient extractable text (OCR required)."""
    pass


def sanitize_text(text: str) -> str:
    """Removes null bytes and control characters, normalizes line endings and whitespace."""
    if not text:
        return ""
    # Strip null bytes and non-printable control characters (except newline, tab)
    cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)
    # Normalize carriage returns
    cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")
    return cleaned.strip()


def extract_text_from_pdf(pdf_bytes: bytes) -> list[tuple[int, str]]:
    """
    Extracts text page-by-page from PDF bytes using pypdf.
    Returns a list of (page_number, text) tuples (1-indexed).
    Raises ScannedPdfError if total extracted text across all pages is under 50 characters.
    """
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
    except Exception as e:
        raise ExtractionError(f"Failed to parse PDF document: {e}")

    total_pages = len(reader.pages)
    if total_pages == 0:
        raise ExtractionError("PDF document has 0 pages.")

    pages_data: list[tuple[int, str]] = []
    total_chars = 0

    for idx, page in enumerate(reader.pages):
        page_num = idx + 1
        try:
            raw_text = page.extract_text() or ""
        except Exception:
            raw_text = ""

        cleaned = sanitize_text(raw_text)
        if cleaned:
            pages_data.append((page_num, cleaned))
            total_chars += len(cleaned)

    # Check for scanned or image-only PDFs
    if total_chars < 50:
        raise ScannedPdfError(
            f"Scanned or image-only PDF detected ({total_chars} extractable characters across {total_pages} pages). "
            "OCR is not supported in Phase 5."
        )

    return pages_data
