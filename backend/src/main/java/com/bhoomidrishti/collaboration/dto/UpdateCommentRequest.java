package com.bhoomidrishti.collaboration.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCommentRequest(
        @NotBlank(message = "Comment content cannot be empty")
        @Size(max = 10000, message = "Comment content cannot exceed 10000 characters")
        String content
) {}
