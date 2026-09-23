package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.SavedResearch;
import java.time.Instant;
import java.util.UUID;

public record SavedResearchResponse(
        UUID id,
        UUID userId,
        UUID researchDocumentId,
        String documentTitle,
        UUID documentChunkId,
        String title,
        String notes,
        String tags,
        Instant createdAt
) {
    public static SavedResearchResponse from(SavedResearch sr) {
        String docTitle = sr.getResearchDocument() != null ? sr.getResearchDocument().getTitle() : null;
        return new SavedResearchResponse(
                sr.getId(),
                sr.getUser().getId(),
                sr.getResearchDocument() != null ? sr.getResearchDocument().getId() : null,
                docTitle,
                sr.getDocumentChunkId(),
                sr.getTitle(),
                sr.getNotes(),
                sr.getTags(),
                sr.getCreatedAt()
        );
    }
}
