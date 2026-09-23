package com.bhoomidrishti.knowledge.dto;

import java.util.List;

public record KnowledgeSearchResponse(
        String query,
        int totalResults,
        int searchDurationMs,
        List<EvidenceItemResponse> results
) {
}
