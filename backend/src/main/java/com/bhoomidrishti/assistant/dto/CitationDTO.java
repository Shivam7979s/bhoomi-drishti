package com.bhoomidrishti.assistant.dto;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Authoritative citation DTO bound directly to a retrieved PostgreSQL document chunk.
 * Citation metadata is strictly backend-owned.
 */
public record CitationDTO(
        int citationIndex,
        UUID chunkId,
        UUID documentId,
        String documentTitle,
        String documentType,
        Integer pageNumber,
        String sectionTitle,
        String authors,
        String organization,
        LocalDate publicationDate,
        String sourceUrl,
        double similarity,
        String formattedCitation,
        String quote
) {
}
