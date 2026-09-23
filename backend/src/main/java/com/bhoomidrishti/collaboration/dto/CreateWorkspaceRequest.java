package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateWorkspaceRequest(
        @NotBlank(message = "Workspace name is required")
        @Size(max = 120, message = "Workspace name cannot exceed 120 characters")
        String name,

        @Size(max = 140, message = "Slug cannot exceed 140 characters")
        String slug,

        @Size(max = 5000, message = "Description cannot exceed 5000 characters")
        String description,

        @Size(max = 180, message = "Institution cannot exceed 180 characters")
        String institution,

        WorkspaceVisibility visibility
) {}
