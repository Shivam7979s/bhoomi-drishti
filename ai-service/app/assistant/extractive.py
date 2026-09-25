from typing import Optional
from app.assistant.models import EvidenceChunk, AuthorizedContext


class ExtractiveFallbackProvider:
    """
    Deterministic extractive fallback provider that compiles verbatim evidence excerpts
    with explicit citation indices without calling any generative LLM.
    Guarantees 100% offline, deterministic, and safe operation.
    """

    async def synthesize(
        self,
        query: str,
        evidence: list[EvidenceChunk],
        context: Optional[AuthorizedContext] = None,
    ) -> tuple[str, list[int], str]:
        """
        Generates an extractive response citing all supplied chunks in order.
        Returns:
            (answer_text, list_of_cited_indices, provider_name)
        """
        if not evidence:
            return (
                "The available statutory and research documents do not contain sufficient evidence to answer this question.",
                [],
                "extractive_fallback",
            )

        lines = []
        if context:
            lines.append(f"[Active Statutory Context: {context.title} ({context.context_type})]")
            lines.append("")
        lines.append("Based on the indexed statutory and research documents, the following authoritative evidence was retrieved:")
        lines.append("")

        cited_indices = []
        for chunk in evidence:
            idx = chunk.citation_index
            cited_indices.append(idx)

            loc_parts = []
            if chunk.page_number is not None:
                loc_parts.append(f"Page {chunk.page_number}")
            if chunk.section_title:
                loc_parts.append(f"§ {chunk.section_title}")
            loc_str = f" ({', '.join(loc_parts)})" if loc_parts else ""

            # Truncate text cleanly to avoid unbounded responses while preserving context
            text_preview = chunk.text.strip()
            if len(text_preview) > 350:
                text_preview = text_preview[:350].rsplit(" ", 1)[0] + "..."

            lines.append(f"[{idx}] {chunk.document_title}{loc_str}")
            lines.append(f'"{text_preview}"')
            lines.append("")

        answer = "\n".join(lines).strip()
        return answer, cited_indices, "extractive_fallback"
