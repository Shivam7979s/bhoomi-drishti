package com.bhoomidrishti.knowledge.dto;

import com.bhoomidrishti.knowledge.entity.ProcessingStatus;
import java.time.Instant;
import java.util.UUID;

public record DocumentProcessingStatusResponse(
        UUID id,
        UUID researchDocumentId,
        ProcessingStatus status,
        String errorMessage,
        int chunkCount,
        String contentHash,
        String processingVersion,
        Instant startedAt,
        Instant completedAt
) {
    public static DocumentProcessingStatusResponse notIngested(UUID researchDocumentId) {
        return new DocumentProcessingStatusResponse(
                null,
                researchDocumentId,
                ProcessingStatus.NOT_INGESTED,
                null,
                0,
                null,
                "v1-bge-small",
                null,
                null
        );
    }
}
