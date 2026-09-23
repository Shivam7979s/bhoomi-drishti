package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.ProjectRole;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AddProjectMemberRequest(
        @NotNull(message = "userId is required")
        UUID userId,

        @NotNull(message = "role is required")
        ProjectRole role
) {}
