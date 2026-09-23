package com.bhoomidrishti.policy.dto;

import com.bhoomidrishti.policy.entity.EvidenceType;
import com.bhoomidrishti.policy.entity.ScenarioEvidence;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ScenarioEvidenceResponse(
        UUID id,
        UUID scenarioId,
        UUID researchDocumentId,
        String researchDocumentTitle,
        UUID documentChunkId,
        EvidenceType evidenceType,
        String rationale,
        BigDecimal similarityScore,
        UUID linkedById,
        String linkedByName,
        Instant linkedAt
) {
    public static ScenarioEvidenceResponse from(ScenarioEvidence e) {
        if (e == null) return null;
        UUID docId = e.getResearchDocument() != null ? e.getResearchDocument().getId() : null;
        String docTitle = e.getResearchDocument() != null ? e.getResearchDocument().getTitle() : null;
        UUID userId = e.getLinkedBy() != null ? e.getLinkedBy().getId() : null;
        String userName = e.getLinkedBy() != null ? e.getLinkedBy().getName() : null;

        return new ScenarioEvidenceResponse(
                e.getId(),
                e.getScenario() != null ? e.getScenario().getId() : null,
                docId,
                docTitle,
                e.getDocumentChunkId(),
                e.getEvidenceType(),
                e.getRationale(),
                e.getSimilarityScore(),
                userId,
                userName,
                e.getLinkedAt()
        );
    }
}
