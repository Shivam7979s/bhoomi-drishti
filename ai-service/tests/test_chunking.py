from app.chunking.chunker import DeterministicChunker


def test_chunker_preserves_page_boundaries():
    chunker = DeterministicChunker(target_size=200, overlap=30, min_size=50)

    pages = [
        (1, "Page 1 paragraph describing land parcel boundaries in Bhopal. It has sufficient length to form a valid chunk."),
        (2, "Page 2 paragraph containing soil classification data and irrigation metrics for agricultural parcels in MP."),
    ]

    chunks = chunker.chunk_pages(pages)

    assert len(chunks) >= 2
    # Verify no chunk has a page number that mixes page 1 and page 2
    for c in chunks:
        assert c.page_number in (1, 2)

    # First chunk is on page 1, last chunk is on page 2
    assert chunks[0].page_number == 1
    assert chunks[-1].page_number == 2


def test_chunker_heading_detection():
    chunker = DeterministicChunker(target_size=300, overlap=20, min_size=30)

    pages = [
        (1, "# 1. INTRODUCTION\n\nThis section introduces cadastral mapping in India.\n\n# 2. METHODOLOGY\n\nThis section describes remote sensing techniques.")
    ]

    chunks = chunker.chunk_pages(pages)
    assert len(chunks) >= 2

    # Verify section titles were detected
    sections = [c.section_title for c in chunks if c.section_title]
    assert any("INTRODUCTION" in s for s in sections)
    assert any("METHODOLOGY" in s for s in sections)


def test_chunker_content_hash():
    chunker = DeterministicChunker(target_size=200, overlap=20, min_size=30)
    pages = [(1, "Deterministic content hash test text that should produce an exact SHA-256 string.")]
    chunks = chunker.chunk_pages(pages)

    assert len(chunks) == 1
    assert len(chunks[0].content_hash) == 64
    assert chunks[0].chunk_index == 0
