package com.bhoomidrishti.knowledge.dto;

import com.bhoomidrishti.knowledge.entity.ProcessingStatus;
import java.util.UUID;

public record IngestDocumentResponse(
        UUID documentId,
        ProcessingStatus status,
        String message
) {
}
