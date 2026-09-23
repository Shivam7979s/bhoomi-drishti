package com.bhoomidrishti.collaboration.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record LinkLandRecordRequest(
        @NotNull(message = "landRecordId is required")
        UUID landRecordId,

        @Size(max = 5000, message = "contextNotes cannot exceed 5000 characters")
        String contextNotes
) {}
