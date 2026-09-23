package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.DatasetFormat;
import jakarta.validation.constraints.Size;

public record UpdateSharedDatasetRequest(
        @Size(max = 255, message = "Dataset title cannot exceed 255 characters")
        String title,

        @Size(max = 5000, message = "Description cannot exceed 5000 characters")
        String description,

        DatasetFormat format,

        @Size(max = 1024, message = "sourceUrl cannot exceed 1024 characters")
        String sourceUrl,

        @Size(max = 255, message = "spatialCoverage cannot exceed 255 characters")
        String spatialCoverage,

        @Size(max = 100, message = "temporalCoverage cannot exceed 100 characters")
        String temporalCoverage,

        @Size(max = 100, message = "license cannot exceed 100 characters")
        String license,

        Long recordCount,

        Long fileSizeBytes
) {}
