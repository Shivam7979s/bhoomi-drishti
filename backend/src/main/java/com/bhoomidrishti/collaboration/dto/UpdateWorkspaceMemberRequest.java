package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.WorkspaceRole;
import jakarta.validation.constraints.NotNull;

public record UpdateWorkspaceMemberRequest(
        @NotNull(message = "role is required")
        WorkspaceRole role
) {}
