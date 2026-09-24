package com.bhoomidrishti.governance.dto;

import com.bhoomidrishti.governance.entity.GovernanceEvidenceType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record LinkGovernanceEvidenceRequest(
        UUID researchDocumentId,

        UUID documentChunkId,

        @NotNull(message = "Evidence type is required")
        GovernanceEvidenceType evidenceType,

        String rationale,

        @DecimalMin(value = "-1.0000", message = "Similarity score cannot be less than -1.0000")
        @DecimalMax(value = "1.0000", message = "Similarity score cannot exceed 1.0000")
        BigDecimal similarityScore) {}
