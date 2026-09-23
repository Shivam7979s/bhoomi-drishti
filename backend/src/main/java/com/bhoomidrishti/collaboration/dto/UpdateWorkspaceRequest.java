package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.WorkspaceStatus;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import jakarta.validation.constraints.Size;

public record UpdateWorkspaceRequest(
        @Size(max = 120, message = "Workspace name cannot exceed 120 characters")
        String name,

        @Size(max = 5000, message = "Description cannot exceed 5000 characters")
        String description,

        @Size(max = 180, message = "Institution cannot exceed 180 characters")
        String institution,

        WorkspaceVisibility visibility,

        WorkspaceStatus status
) {}
