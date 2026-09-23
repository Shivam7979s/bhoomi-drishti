from dataclasses import dataclass
import hashlib


@dataclass
class Chunk:
    chunk_index: int
    text: str
    page_number: int | None
    section_title: str | None
    token_count: int
    content_hash: str

    @classmethod
    def create(
        cls,
        chunk_index: int,
        text: str,
        page_number: int | None,
        section_title: str | None,
    ) -> "Chunk":
        # Approximate token count (1 word ≈ 1.3 tokens, or ~4 chars per token)
        token_count = max(1, len(text.split()))
        content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
        return cls(
            chunk_index=chunk_index,
            text=text,
            page_number=page_number,
            section_title=section_title,
            token_count=token_count,
            content_hash=content_hash,
        )
