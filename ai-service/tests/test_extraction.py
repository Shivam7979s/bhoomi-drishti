import io
import pytest
from pypdf import PdfWriter
from app.extraction.pdf_extractor import extract_text_from_pdf, ScannedPdfError, sanitize_text
from app.extraction.text_extractor import extract_text_from_plain_text


def test_sanitize_text():
    dirty = "Hello\x00 World!\r\nLine 2\x08"
    cleaned = sanitize_text(dirty)
    assert cleaned == "Hello World!\nLine 2"


def test_extract_plain_text():
    content = b"# Land Governance Policy\n\nThis policy regulates agricultural land parcels in MP."
    pages = extract_text_from_plain_text(content)
    assert len(pages) == 1
    assert pages[0][0] == 1
    assert "Land Governance Policy" in pages[0][1]


def test_extract_empty_plain_text_raises_error():
    with pytest.raises(Exception):
        extract_text_from_plain_text(b"")


def test_scanned_pdf_detection():
    # Create a 1-page PDF with no text (empty page)
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    buf = io.BytesIO()
    writer.write(buf)
    pdf_bytes = buf.getvalue()

    with pytest.raises(ScannedPdfError, match="Scanned or image-only PDF detected"):
        extract_text_from_pdf(pdf_bytes)
