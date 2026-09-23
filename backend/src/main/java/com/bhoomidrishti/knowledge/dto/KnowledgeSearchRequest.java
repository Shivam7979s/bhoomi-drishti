package com.bhoomidrishti.knowledge.dto;

import com.bhoomidrishti.research.entity.DocumentType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record KnowledgeSearchRequest(
        @NotBlank(message = "query is required")
        @Size(min = 2, max = 500, message = "query must be between 2 and 500 characters")
        String query,

        @Min(value = 1, message = "topK must be at least 1")
        @Max(value = 20, message = "topK cannot exceed 20")
        Integer topK,

        DocumentType documentType,

        @Size(max = 255, message = "organization cannot exceed 255 characters")
        String organization
) {
    public int resolvedTopK() {
        return (topK == null || topK < 1) ? 5 : Math.min(topK, 20);
    }
}
