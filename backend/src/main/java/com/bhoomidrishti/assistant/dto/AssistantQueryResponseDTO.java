package com.bhoomidrishti.assistant.dto;

import java.util.List;
import java.util.Map;

/**
 * Structured evidence-grounded response returned by the assistant.
 * Embedding similarity is NOT exposed as an artificial probability or confidence score.
 */
public record AssistantQueryResponseDTO(
        String query,
        String answer,
        GroundingStatus groundingStatus,
        List<CitationDTO> citations,
        String disclaimer,
        Map<String, Object> retrievalMetadata
) {
}
