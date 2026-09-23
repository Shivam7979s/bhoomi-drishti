package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.WorkspaceRole;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AddWorkspaceMemberRequest(
        @NotNull(message = "userId is required")
        UUID userId,

        @NotNull(message = "role is required")
        WorkspaceRole role
) {}
