package com.bhoomidrishti.collaboration.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateSavedResearchRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title cannot exceed 255 characters")
        String title,

        @Size(max = 10000, message = "Notes cannot exceed 10000 characters")
        String notes,

        @Size(max = 255, message = "Tags cannot exceed 255 characters")
        String tags
) {}
