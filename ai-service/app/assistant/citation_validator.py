import re
from app.assistant.models import EvidenceChunk, Citation


def extract_concise_quote(text: str, max_chars: int = 200) -> str:
    """
    Extracts a concise quote snippet from chunk text.
    Prefers the first complete sentence, truncated cleanly.
    """
    cleaned = text.strip()
    match = re.search(r"^([^.!?\n]+[.!?])", cleaned)
    if match and len(match.group(1)) <= max_chars:
        return match.group(1).strip()
    if len(cleaned) <= max_chars:
        return cleaned
    return cleaned[:max_chars].rsplit(" ", 1)[0] + "..."


def reconcile_citations(
    answer: str,
    evidence: list[EvidenceChunk],
) -> tuple[str, list[Citation]]:
    """
    Reconciles citation references in the generated answer against authoritative retrieved chunks.

    1. Identifies all bracketed citation references [N].
    2. Verifies that index N exists in the retrieved evidence (1 <= N <= len(evidence)).
    3. Strips phantom citations (e.g., [99]) from the answer text to eliminate ungrounded references.
    4. Builds Citation models with authoritative metadata from PostgreSQL.
    5. If no bracketed citations are found (e.g., in fallback), builds citations for all presented chunks.
    """
    evidence_by_index = {chunk.citation_index: chunk for chunk in evidence}
    valid_indices = set(evidence_by_index.keys())

    # Find all referenced indices in order of appearance
    raw_matches = [int(m) for m in re.findall(r"\[(\d+)\]", answer)]
    referenced_valid = []
    has_phantom = False

    for idx in raw_matches:
        if idx in valid_indices:
            if idx not in referenced_valid:
                referenced_valid.append(idx)
        else:
            has_phantom = True

    # Strip phantom citations from answer text
    cleaned_answer = answer
    if has_phantom:
        def replace_phantom(match: re.Match) -> str:
            idx = int(match.group(1))
            return match.group(0) if idx in valid_indices else ""

        cleaned_answer = re.sub(r"\s*\[(\d+)\]", replace_phantom, answer)
        # Clean up any residual double spaces from stripped citations
        cleaned_answer = re.sub(r" +", " ", cleaned_answer).strip()

    # Determine which chunks to produce citations for
    citations: list[Citation] = []
    target_indices = referenced_valid if referenced_valid else list(valid_indices)
    target_indices.sort()

    for idx in target_indices:
        chunk = evidence_by_index[idx]
        citations.append(
            Citation(
                citation_index=chunk.citation_index,
                chunk_id=chunk.chunk_id,
                document_id=chunk.document_id,
                document_title=chunk.document_title,
                document_type=chunk.document_type,
                page_number=chunk.page_number,
                section_title=chunk.section_title,
                authors=chunk.authors,
                organization=chunk.organization,
                publication_date=chunk.publication_date,
                source_url=chunk.source_url,
                similarity=chunk.similarity,
                formatted_citation=chunk.formatted_citation,
                quote=extract_concise_quote(chunk.text),
            )
        )

    return cleaned_answer, citations
