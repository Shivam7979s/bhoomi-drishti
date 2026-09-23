from app.extraction.pdf_extractor import ExtractionError, sanitize_text


def extract_text_from_plain_text(text_bytes: bytes) -> list[tuple[int, str]]:
    """
    Extracts text from plain text or markdown bytes.
    Attempts UTF-8 first, falls back to latin-1.
    Returns [(1, sanitized_text)].
    """
    try:
        raw_text = text_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            raw_text = text_bytes.decode("latin-1")
        except Exception as e:
            raise ExtractionError(f"Failed to decode text document encoding: {e}")

    cleaned = sanitize_text(raw_text)
    if len(cleaned) < 10:
        raise ExtractionError("Text document contains insufficient text (less than 10 characters).")

    return [(1, cleaned)]
