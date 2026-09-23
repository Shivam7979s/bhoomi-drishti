package com.bhoomidrishti.policy.dto;

import com.bhoomidrishti.policy.entity.EvidenceType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request payload to link research evidence to a policy scenario.
 */
public record LinkScenarioEvidenceRequest(
        @NotNull(message = "Research document ID is required")
        UUID researchDocumentId,

        UUID documentChunkId,

        @NotNull(message = "Evidence type is required")
        EvidenceType evidenceType,

        String rationale,

        @DecimalMin(value = "-1.0000", message = "Similarity score cannot be less than -1.0000")
        @DecimalMax(value = "1.0000", message = "Similarity score cannot be greater than 1.0000")
        BigDecimal similarityScore
) {
}
