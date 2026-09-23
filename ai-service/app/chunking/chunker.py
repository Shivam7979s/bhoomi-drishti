import re
from app.chunking.models import Chunk

# Regex to detect Markdown headings or section titles
SECTION_PATTERN = re.compile(r"^(?:#{1,4}\s+(.+)|(?:\d+\.?\s+)?([A-Z\s]{4,80}))\s*$")


class DeterministicChunker:
    """
    Deterministic sliding-window text chunker that preserves document structure,
    page boundaries, section headings, and content hashes.
    """

    def __init__(
        self,
        target_size: int = 600,
        overlap: int = 100,
        min_size: int = 100,
    ):
        self.target_size = target_size
        self.overlap = overlap
        self.min_size = min_size

    def chunk_pages(self, pages: list[tuple[int, str]]) -> list[Chunk]:
        """
        Chunks a list of (page_number, text) tuples.
        Page transitions strictly initiate clean chunk boundaries.
        """
        all_chunks: list[Chunk] = []
        global_chunk_index = 0
        current_section: str | None = None

        for page_num, page_text in pages:
            page_chunks, current_section = self._chunk_single_page(
                page_text=page_text,
                page_num=page_num,
                start_index=global_chunk_index,
                initial_section=current_section,
            )
            all_chunks.extend(page_chunks)
            global_chunk_index += len(page_chunks)

        # Fallback: if entire document yielded 0 chunks due to length < min_size,
        # but has content, emit 1 chunk containing whatever text is present.
        if not all_chunks and pages:
            combined = "\n\n".join(text for _, text in pages if text.strip())
            if combined.strip():
                all_chunks.append(
                    Chunk.create(
                        chunk_index=0,
                        text=combined.strip(),
                        page_number=pages[0][0],
                        section_title=None,
                    )
                )

        return all_chunks

    def _chunk_single_page(
        self,
        page_text: str,
        page_num: int,
        start_index: int,
        initial_section: str | None,
    ) -> tuple[list[Chunk], str | None]:
        chunks: list[Chunk] = []
        current_section = initial_section

        # Split into paragraph blocks
        paragraphs = re.split(r"\n\s*\n", page_text)

        buffer = ""
        chunk_idx = start_index

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # Check if paragraph is a section heading
            match = SECTION_PATTERN.match(para)
            if match:
                if len(buffer) >= self.min_size:
                    chunks.append(
                        Chunk.create(
                            chunk_index=chunk_idx,
                            text=buffer.strip(),
                            page_number=page_num,
                            section_title=current_section,
                        )
                    )
                    chunk_idx += 1
                    buffer = ""
                heading = (match.group(1) or match.group(2) or para).lstrip("#").strip()
                if len(heading) < 120:
                    current_section = heading

            # If adding this paragraph exceeds target size and buffer has content
            if len(buffer) + len(para) > self.target_size and len(buffer) >= self.min_size:
                chunks.append(
                    Chunk.create(
                        chunk_index=chunk_idx,
                        text=buffer.strip(),
                        page_number=page_num,
                        section_title=current_section,
                    )
                )
                chunk_idx += 1
                # Preserve overlap from the end of current buffer
                if self.overlap > 0 and len(buffer) > self.overlap:
                    buffer = buffer[-self.overlap :] + " " + para
                else:
                    buffer = para
            else:
                if buffer:
                    buffer += "\n\n" + para
                else:
                    buffer = para

            # If a single paragraph is larger than target_size * 1.5, split into sentence windows
            while len(buffer) > self.target_size + self.overlap:
                split_point = self._find_split_point(buffer, self.target_size)
                chunk_text = buffer[:split_point].strip()
                if len(chunk_text) >= self.min_size:
                    chunks.append(
                        Chunk.create(
                            chunk_index=chunk_idx,
                            text=chunk_text,
                            page_number=page_num,
                            section_title=current_section,
                        )
                    )
                    chunk_idx += 1
                buffer = buffer[max(0, split_point - self.overlap) :].strip()

        # Flush remaining buffer
        if len(buffer.strip()) >= self.min_size:
            chunks.append(
                Chunk.create(
                    chunk_index=chunk_idx,
                    text=buffer.strip(),
                    page_number=page_num,
                    section_title=current_section,
                )
            )
        elif buffer.strip() and not chunks:
            # If the entire page was smaller than min_size, still create a chunk
            chunks.append(
                Chunk.create(
                    chunk_index=chunk_idx,
                    text=buffer.strip(),
                    page_number=page_num,
                    section_title=current_section,
                )
            )

        return chunks, current_section

    def _find_split_point(self, text: str, target: int) -> int:
        """Finds the best sentence or word boundary near target position."""
        if len(text) <= target:
            return len(text)

        # Look for sentence boundary (. ? ! followed by space) within target ± 150 chars
        search_window = text[max(0, target - 100) : min(len(text), target + 100)]
        match = re.search(r"[.!?]\s+", search_window)
        if match:
            return max(0, target - 100) + match.end()

        # Fallback: look for space or newline
        space_idx = text.rfind(" ", max(0, target - 100), min(len(text), target + 100))
        if space_idx != -1:
            return space_idx + 1

        return target
