package com.bhoomidrishti.collaboration.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CreateCommentRequest(
        @NotBlank(message = "Comment content cannot be empty")
        @Size(max = 10000, message = "Comment content cannot exceed 10000 characters")
        String content,

        UUID parentCommentId
) {}
