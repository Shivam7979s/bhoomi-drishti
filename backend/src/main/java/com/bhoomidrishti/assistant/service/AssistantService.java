package com.bhoomidrishti.assistant.service;

import com.bhoomidrishti.assistant.dto.AssistantQueryRequestDTO;
import com.bhoomidrishti.assistant.dto.AssistantQueryResponseDTO;
import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.knowledge.client.AiServiceClient;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

/**
 * Service orchestrating Evidence-Grounded Statutory AI Assistant queries.
 *
 * <p>Enforces authorization BEFORE evidence retrieval or synthesis:
 * <ul>
 *   <li>Public / Unauthenticated callers: restricted strictly to PUBLISHED research documents.</li>
 *   <li>ADMIN and GOVERNMENT_OFFICIAL: permitted to query across draft and published documents.</li>
 * </ul>
 *
 * <p>Guarantees that citation metadata is backend-owned and never invented by generative models.
 */
@Service
public class AssistantService {

    private final AiServiceClient aiServiceClient;

    public AssistantService(AiServiceClient aiServiceClient) {
        this.aiServiceClient = aiServiceClient;
    }

    /**
     * Executes evidence-grounded statutory query.
     *
     * @param request the user query and optional metadata filters
     * @param auth    the Spring Security authentication token (may be anonymous/null)
     * @return the structured response with authoritative citations and grounding status
     */
    public AssistantQueryResponseDTO query(AssistantQueryRequestDTO request, Authentication auth) {
        if (request == null || request.query() == null || request.query().trim().isBlank()) {
            throw new IllegalArgumentException("Query must not be blank.");
        }

        // Enforce RBAC rules at search/retrieval boundary:
        // PUBLIC / Unauthenticated users can ONLY retrieve evidence from PUBLISHED documents.
        boolean onlyPublished = true;
        List<UUID> allowedDocIds = null;

        if (auth != null && auth.isAuthenticated()) {
            boolean isAdminOrGov = auth.getAuthorities().stream().anyMatch(a ->
                    a.getAuthority().equals(Role.ADMIN.authority())
                            || a.getAuthority().equals(Role.GOVERNMENT_OFFICIAL.authority()));

            if (isAdminOrGov) {
                // Admin and Government Officials can query across all document statuses
                onlyPublished = false;
            }
        }

        return aiServiceClient.queryAssistant(request, onlyPublished, allowedDocIds);
    }
}
