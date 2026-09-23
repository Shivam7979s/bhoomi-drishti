package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceRole;
import com.bhoomidrishti.collaboration.entity.WorkspaceStatus;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import java.time.Instant;
import java.util.UUID;

public record WorkspaceResponse(
        UUID id,
        String name,
        String slug,
        String description,
        String institution,
        WorkspaceVisibility visibility,
        WorkspaceStatus status,
        UserSummaryDto createdBy,
        long memberCount,
        long projectCount,
        WorkspaceRole currentUserRole,
        Instant createdAt,
        Instant updatedAt
) {
    public static WorkspaceResponse from(
            Workspace workspace,
            long memberCount,
            long projectCount,
            WorkspaceRole currentUserRole,
            boolean isCallerAuthenticated) {
        return new WorkspaceResponse(
                workspace.getId(),
                workspace.getName(),
                workspace.getSlug(),
                workspace.getDescription(),
                workspace.getInstitution(),
                workspace.getVisibility(),
                workspace.getStatus(),
                UserSummaryDto.from(workspace.getCreatedBy(), isCallerAuthenticated),
                memberCount,
                projectCount,
                currentUserRole,
                workspace.getCreatedAt(),
                workspace.getUpdatedAt()
        );
    }
}
