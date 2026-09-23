package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.ProjectRole;
import jakarta.validation.constraints.NotNull;

public record UpdateProjectMemberRequest(
        @NotNull(message = "role is required")
        ProjectRole role
) {}
