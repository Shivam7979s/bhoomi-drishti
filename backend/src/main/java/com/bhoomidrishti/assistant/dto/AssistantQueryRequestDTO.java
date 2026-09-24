package com.bhoomidrishti.assistant.dto;

import com.bhoomidrishti.research.entity.DocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Public request payload for the Evidence-Grounded Statutory AI Assistant.
 * Clients cannot select model, provider, prompts, or grounding thresholds.
 */
public record AssistantQueryRequestDTO(
        @NotBlank(message = "Query must not be blank")
        @Size(min = 2, max = 500, message = "Query must be between 2 and 500 characters")
        String query,

        Integer topK,

        DocumentType documentType,

        String organization
) {
    public int resolvedTopK() {
        if (topK == null || topK < 1) {
            return 5;
        }
        return Math.min(topK, 20);
    }
}
