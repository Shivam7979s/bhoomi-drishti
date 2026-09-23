package com.bhoomidrishti.policy.dto;

import com.bhoomidrishti.policy.entity.EvidenceType;
import com.bhoomidrishti.policy.entity.ScenarioEvidence;
import com.bhoomidrishti.policy.repository.DocumentChunkQueryRepository.DocumentChunkProvenance;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Structured response representing evidence linked to a policy scenario with complete provenance.
 */
public record ScenarioEvidenceResponse(
        UUID id,
        UUID scenarioId,
        UUID researchDocumentId,
        String documentTitle,
        String documentType,
        UUID documentChunkId,
        String chunkText,
        Integer chunkPageNumber,
        String chunkSectionTitle,
        EvidenceType evidenceType,
        String rationale,
        BigDecimal similarityScore,
        UUID linkedById,
        String linkedByName,
        Instant linkedAt
) {
    public static ScenarioEvidenceResponse from(ScenarioEvidence evidence, DocumentChunkProvenance chunk) {
        UUID docId = evidence.getResearchDocument() != null ? evidence.getResearchDocument().getId() : null;
        String docTitle = evidence.getResearchDocument() != null ? evidence.getResearchDocument().getTitle() : null;
        String docType = evidence.getResearchDocument() != null && evidence.getResearchDocument().getDocumentType() != null
                ? evidence.getResearchDocument().getDocumentType().name() : null;

        String chunkText = chunk != null ? chunk.text() : null;
        Integer chunkPage = chunk != null ? chunk.pageNumber() : null;
        String chunkSection = chunk != null ? chunk.sectionTitle() : null;

        UUID linkedById = evidence.getLinkedBy() != null ? evidence.getLinkedBy().getId() : null;
        String linkedByName = evidence.getLinkedBy() != null ? evidence.getLinkedBy().getName() : null;

        return new ScenarioEvidenceResponse(
                evidence.getId(),
                evidence.getScenario() != null ? evidence.getScenario().getId() : null,
                docId,
                docTitle,
                docType,
                evidence.getDocumentChunkId(),
                chunkText,
                chunkPage,
                chunkSection,
                evidence.getEvidenceType(),
                evidence.getRationale(),
                evidence.getSimilarityScore(),
                linkedById,
                linkedByName,
                evidence.getLinkedAt()
        );
    }
}
