package com.bhoomidrishti.assistant.dto;

import java.util.UUID;

/**
 * Lightweight frontend reference to platform context.
 *
 * <p>The frontend NEVER supplies claims, permissions, or raw prompt text;
 * it only supplies resource identifiers that Spring Boot resolves and authorizes server-side.
 */
public record AssistantContextRequestDTO(
        String contextType, // "GOVERNANCE_INDICATOR", "GOVERNANCE_SNAPSHOT", "GOVERNANCE_COMPARISON", "RESEARCH_DOCUMENT", "LAND_RECORD"
        String indicatorCode,
        UUID snapshotId,
        UUID comparisonBaseSnapshotId,
        UUID comparisonTargetSnapshotId,
        UUID documentId,
        UUID landRecordId,
        UUID projectId
) {
    public static AssistantContextRequestDTO forIndicator(String indicatorCode) {
        return new AssistantContextRequestDTO("GOVERNANCE_INDICATOR", indicatorCode, null, null, null, null, null, null);
    }

    public static AssistantContextRequestDTO forSnapshot(UUID snapshotId) {
        return new AssistantContextRequestDTO("GOVERNANCE_SNAPSHOT", null, snapshotId, null, null, null, null, null);
    }

    public static AssistantContextRequestDTO forComparison(UUID baseSnapshotId, UUID targetSnapshotId) {
        return new AssistantContextRequestDTO("GOVERNANCE_COMPARISON", null, null, baseSnapshotId, targetSnapshotId, null, null, null);
    }

    public static AssistantContextRequestDTO forDocument(UUID documentId) {
        return new AssistantContextRequestDTO("RESEARCH_DOCUMENT", null, null, null, null, documentId, null, null);
    }

    public static AssistantContextRequestDTO forLandRecord(UUID landRecordId) {
        return new AssistantContextRequestDTO("LAND_RECORD", null, null, null, null, null, landRecordId, null);
    }
}
