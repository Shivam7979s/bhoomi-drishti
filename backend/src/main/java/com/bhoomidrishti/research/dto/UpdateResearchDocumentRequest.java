package com.bhoomidrishti.research.dto;

import com.bhoomidrishti.research.entity.DocumentType;
import com.bhoomidrishti.research.entity.ResearchDocumentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdateResearchDocumentRequest(
        @NotBlank(message = "title is required")
        @Size(max = 255, message = "title cannot exceed 255 characters")
        String title,

        @NotBlank(message = "description is required")
        @Size(max = 5000, message = "description cannot exceed 5000 characters")
        String description,

        @NotNull(message = "documentType is required")
        DocumentType documentType,

        @NotBlank(message = "authors is required")
        @Size(max = 255, message = "authors cannot exceed 255 characters")
        String authors,

        @Size(max = 255, message = "organization cannot exceed 255 characters")
        String organization,

        LocalDate publicationDate,

        @Size(max = 1024, message = "sourceUrl cannot exceed 1024 characters")
        String sourceUrl,

        @Size(max = 1024, message = "fileUrl cannot exceed 1024 characters")
        String fileUrl,

        @Size(max = 32, message = "language cannot exceed 32 characters")
        String language,

        @Size(max = 512, message = "keywords cannot exceed 512 characters")
        String keywords,

        @Size(max = 10000, message = "abstractText cannot exceed 10000 characters")
        String abstractText,

        @NotNull(message = "status is required")
        ResearchDocumentStatus status
) {
}
