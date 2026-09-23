package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.ProjectMember;
import com.bhoomidrishti.collaboration.entity.ProjectRole;
import java.time.Instant;
import java.util.UUID;

public record ProjectMemberResponse(
        UUID id,
        UUID projectId,
        UUID userId,
        String userName,
        String userEmail,
        ProjectRole role,
        Instant joinedAt
) {
    public static ProjectMemberResponse from(ProjectMember member, boolean includeEmail) {
        return new ProjectMemberResponse(
                member.getId(),
                member.getProject().getId(),
                member.getUser().getId(),
                member.getUser().getName(),
                includeEmail ? member.getUser().getEmail() : null,
                member.getRole(),
                member.getJoinedAt()
        );
    }
}
