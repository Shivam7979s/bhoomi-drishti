package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.ProjectStatus;
import com.bhoomidrishti.collaboration.entity.ProjectVisibility;
import jakarta.validation.constraints.Size;

public record UpdateProjectRequest(
        @Size(max = 200, message = "Project name cannot exceed 200 characters")
        String name,

        @Size(max = 5000, message = "Description cannot exceed 5000 characters")
        String description,

        ProjectStatus status,

        ProjectVisibility visibility
) {}
