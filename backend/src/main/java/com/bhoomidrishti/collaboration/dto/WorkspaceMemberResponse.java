package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.WorkspaceMember;
import com.bhoomidrishti.collaboration.entity.WorkspaceRole;
import java.time.Instant;
import java.util.UUID;

public record WorkspaceMemberResponse(
        UUID id,
        UUID workspaceId,
        UUID userId,
        String userName,
        String userEmail,
        WorkspaceRole role,
        Instant joinedAt
) {
    public static WorkspaceMemberResponse from(WorkspaceMember member, boolean includeEmail) {
        return new WorkspaceMemberResponse(
                member.getId(),
                member.getWorkspace().getId(),
                member.getUser().getId(),
                member.getUser().getName(),
                includeEmail ? member.getUser().getEmail() : null,
                member.getRole(),
                member.getJoinedAt()
        );
    }
}
