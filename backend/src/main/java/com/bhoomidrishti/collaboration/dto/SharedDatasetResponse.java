package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.DatasetFormat;
import com.bhoomidrishti.collaboration.entity.SharedDataset;
import java.time.Instant;
import java.util.UUID;

public record SharedDatasetResponse(
        UUID id,
        UUID workspaceId,
        String title,
        String description,
        DatasetFormat format,
        String sourceUrl,
        String spatialCoverage,
        String temporalCoverage,
        String license,
        Long recordCount,
        Long fileSizeBytes,
        UserSummaryDto createdBy,
        Instant createdAt,
        Instant updatedAt
) {
    public static SharedDatasetResponse from(SharedDataset ds, boolean isCallerAuthenticated) {
        return new SharedDatasetResponse(
                ds.getId(),
                ds.getWorkspace().getId(),
                ds.getTitle(),
                ds.getDescription(),
                ds.getFormat(),
                ds.getSourceUrl(),
                ds.getSpatialCoverage(),
                ds.getTemporalCoverage(),
                ds.getLicense(),
                ds.getRecordCount(),
                ds.getFileSizeBytes(),
                UserSummaryDto.from(ds.getCreatedBy(), isCallerAuthenticated),
                ds.getCreatedAt(),
                ds.getUpdatedAt()
        );
    }
}
