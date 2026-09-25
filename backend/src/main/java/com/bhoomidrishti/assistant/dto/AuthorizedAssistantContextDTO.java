package com.bhoomidrishti.assistant.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Server-authorized, structured platform context assembled by Spring Boot.
 *
 * <p>Transmitted across the internal boundary to the AI Service for prompt assembly.
 * Only non-sensitive, verified factual attributes are included.
 */
public record AuthorizedAssistantContextDTO(
        String contextType,
        String title,
        String summary,
        List<UUID> targetDocumentIds,
        Map<String, Object> metadata
) {
}
