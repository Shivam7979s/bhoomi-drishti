package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.ProjectSharedDataset;
import com.bhoomidrishti.collaboration.entity.SharedDataset;
import java.time.Instant;
import java.util.UUID;

public record ProjectSharedDatasetResponse(
        UUID projectId,
        UUID sharedDatasetId,
        String title,
        String description,
        String format,
        String sourceUrl,
        Long recordCount,
        Instant addedAt
) {
    public static ProjectSharedDatasetResponse from(ProjectSharedDataset psd) {
        SharedDataset ds = psd.getSharedDataset();
        return new ProjectSharedDatasetResponse(
                psd.getProject().getId(),
                ds.getId(),
                ds.getTitle(),
                ds.getDescription(),
                ds.getFormat() != null ? ds.getFormat().name() : null,
                ds.getSourceUrl(),
                ds.getRecordCount(),
                psd.getAddedAt()
        );
    }
}
