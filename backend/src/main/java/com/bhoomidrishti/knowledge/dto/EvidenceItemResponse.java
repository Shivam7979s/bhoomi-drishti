package com.bhoomidrishti.knowledge.dto;

import java.time.LocalDate;
import java.util.UUID;

public record EvidenceItemResponse(
        UUID chunkId,
        UUID documentId,
        String documentTitle,
        String documentType,
        String authors,
        String organization,
        LocalDate publicationDate,
        String text,
        Integer pageNumber,
        String sectionTitle,
        double similarity,
        String sourceUrl,
        String citation,
        int linkedLandRecordsCount
) {
}
