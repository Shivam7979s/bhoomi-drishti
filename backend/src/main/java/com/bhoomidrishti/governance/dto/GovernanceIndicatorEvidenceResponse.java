package com.bhoomidrishti.governance.dto;

import com.bhoomidrishti.governance.entity.GovernanceEvidenceType;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorEvidence;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record GovernanceIndicatorEvidenceResponse(
        UUID id,
        UUID snapshotId,
        UUID researchDocumentId,
        UUID documentChunkId,
        String documentTitle,
        String documentType,
        String chunkText,
        Integer pageNumber,
        String sectionTitle,
        GovernanceEvidenceType evidenceType,
        BigDecimal similarityScore,
        String rationale,
        UUID linkedById,
        String linkedByName,
        Instant linkedAt) {

    public static GovernanceIndicatorEvidenceResponse fromEntity(GovernanceIndicatorEvidence entity) {
        return new GovernanceIndicatorEvidenceResponse(
                entity.getId(),
                entity.getSnapshot().getId(),
                entity.getResearchDocument() != null ? entity.getResearchDocument().getId() : null,
                entity.getDocumentChunkId(),
                entity.getResearchDocument() != null ? entity.getResearchDocument().getTitle() : null,
                entity.getResearchDocument() != null ? entity.getResearchDocument().getDocumentType().name() : null,
                null,
                null,
                null,
                entity.getEvidenceType(),
                entity.getSimilarityScore(),
                entity.getRationale(),
                entity.getLinkedBy().getId(),
                entity.getLinkedBy().getName(),
                entity.getLinkedAt());
    }

    public static GovernanceIndicatorEvidenceResponse fromEntityWithChunk(
            GovernanceIndicatorEvidence entity,
            String chunkText,
            Integer pageNumber,
            String sectionTitle) {
        return new GovernanceIndicatorEvidenceResponse(
                entity.getId(),
                entity.getSnapshot().getId(),
                entity.getResearchDocument() != null ? entity.getResearchDocument().getId() : null,
                entity.getDocumentChunkId(),
                entity.getResearchDocument() != null ? entity.getResearchDocument().getTitle() : null,
                entity.getResearchDocument() != null ? entity.getResearchDocument().getDocumentType().name() : null,
                chunkText,
                pageNumber,
                sectionTitle,
                entity.getEvidenceType(),
                entity.getSimilarityScore(),
                entity.getRationale(),
                entity.getLinkedBy().getId(),
                entity.getLinkedBy().getName(),
                entity.getLinkedAt());
    }
}
