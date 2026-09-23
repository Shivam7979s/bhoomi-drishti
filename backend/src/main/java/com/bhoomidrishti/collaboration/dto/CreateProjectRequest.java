package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.ProjectVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProjectRequest(
        @NotBlank(message = "Project name is required")
        @Size(max = 200, message = "Project name cannot exceed 200 characters")
        String name,

        @Size(max = 220, message = "Slug cannot exceed 220 characters")
        String slug,

        @Size(max = 5000, message = "Description cannot exceed 5000 characters")
        String description,

        ProjectVisibility visibility
) {}
