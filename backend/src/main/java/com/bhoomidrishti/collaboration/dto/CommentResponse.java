package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.ProjectComment;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public record CommentResponse(
        UUID id,
        UUID projectId,
        UUID userId,
        String userName,
        String content,
        boolean isEdited,
        boolean isPinned,
        UUID parentCommentId,
        Instant createdAt,
        Instant updatedAt,
        List<CommentResponse> replies
) {
    public static CommentResponse from(ProjectComment comment) {
        return from(comment, Collections.emptyList());
    }

    public static CommentResponse from(ProjectComment comment, List<CommentResponse> replies) {
        UUID parentId = comment.getParentComment() != null ? comment.getParentComment().getId() : null;
        return new CommentResponse(
                comment.getId(),
                comment.getProject().getId(),
                comment.getUser().getId(),
                comment.getUser().getName(),
                comment.getContent(),
                comment.isEdited(),
                comment.isPinned(),
                parentId,
                comment.getCreatedAt(),
                comment.getUpdatedAt(),
                replies != null ? replies : Collections.emptyList()
        );
    }
}
