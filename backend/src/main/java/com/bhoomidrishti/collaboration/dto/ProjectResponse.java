package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.ProjectRole;
import com.bhoomidrishti.collaboration.entity.ProjectStatus;
import com.bhoomidrishti.collaboration.entity.ProjectVisibility;
import java.time.Instant;
import java.util.UUID;

public record ProjectResponse(
        UUID id,
        UUID workspaceId,
        String workspaceName,
        String name,
        String slug,
        String description,
        ProjectStatus status,
        ProjectVisibility visibility,
        UserSummaryDto createdBy,
        long memberCount,
        long landRecordCount,
        long researchDocCount,
        long datasetCount,
        long commentCount,
        ProjectRole currentUserRole,
        Instant createdAt,
        Instant updatedAt
) {
    public static ProjectResponse from(
            Project project,
            long memberCount,
            long landRecordCount,
            long researchDocCount,
            long datasetCount,
            long commentCount,
            ProjectRole currentUserRole,
            boolean isCallerAuthenticated) {
        return new ProjectResponse(
                project.getId(),
                project.getWorkspace().getId(),
                project.getWorkspace().getName(),
                project.getName(),
                project.getSlug(),
                project.getDescription(),
                project.getStatus(),
                project.getVisibility(),
                UserSummaryDto.from(project.getCreatedBy(), isCallerAuthenticated),
                memberCount,
                landRecordCount,
                researchDocCount,
                datasetCount,
                commentCount,
                currentUserRole,
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
