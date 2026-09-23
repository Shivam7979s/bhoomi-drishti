package com.bhoomidrishti.collaboration.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record LinkResearchDocumentRequest(
        @NotNull(message = "researchDocumentId is required")
        UUID researchDocumentId,

        @Size(max = 5000, message = "relevanceNotes cannot exceed 5000 characters")
        String relevanceNotes
) {}
