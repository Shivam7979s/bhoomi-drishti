package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.ProjectResearchDocument;
import com.bhoomidrishti.research.entity.ResearchDocument;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ProjectResearchDocumentResponse(
        UUID projectId,
        UUID researchDocumentId,
        String title,
        String documentType,
        String authors,
        String organization,
        LocalDate publicationDate,
        String relevanceNotes,
        UserSummaryDto addedBy,
        Instant addedAt
) {
    public static ProjectResearchDocumentResponse from(ProjectResearchDocument prd, boolean isCallerAuthenticated) {
        ResearchDocument doc = prd.getResearchDocument();
        return new ProjectResearchDocumentResponse(
                prd.getProject().getId(),
                doc.getId(),
                doc.getTitle(),
                doc.getDocumentType() != null ? doc.getDocumentType().name() : null,
                doc.getAuthors(),
                doc.getOrganization(),
                doc.getPublicationDate(),
                prd.getRelevanceNotes(),
                UserSummaryDto.from(prd.getAddedBy(), isCallerAuthenticated),
                prd.getAddedAt()
        );
    }
}
