package com.bhoomidrishti.collaboration.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record LinkSharedDatasetRequest(
        @NotNull(message = "sharedDatasetId is required")
        UUID sharedDatasetId
) {}
