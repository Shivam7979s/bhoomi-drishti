package com.bhoomidrishti.assistant.service;

import com.bhoomidrishti.assistant.dto.AssistantQueryRequestDTO;
import com.bhoomidrishti.assistant.dto.AssistantQueryResponseDTO;
import com.bhoomidrishti.assistant.dto.AuthorizedAssistantContextDTO;
import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.knowledge.client.AiServiceClient;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

/**
 * Service orchestrating Evidence-Grounded Statutory AI Assistant queries.
 *
 * <p>Enforces authorization BEFORE evidence retrieval or synthesis:
 * <ul>
 *   <li>Public / Unauthenticated callers: restricted strictly to PUBLISHED research documents.</li>
 *   <li>ADMIN and GOVERNMENT_OFFICIAL: permitted to query across draft and published documents.</li>
 *   <li>Contextual requests: verified and authorized server-side before reaching AI retrieval.</li>
 * </ul>
 *
 * <p>Guarantees that citation metadata is backend-owned and never invented by generative models.
 */
@Service
public class AssistantService {

    private final AiServiceClient aiServiceClient;
    private final AssistantContextResolverService contextResolverService;

    public AssistantService(AiServiceClient aiServiceClient) {
        this(aiServiceClient, null);
    }

    @Autowired
    public AssistantService(
            AiServiceClient aiServiceClient,
            AssistantContextResolverService contextResolverService) {
        this.aiServiceClient = aiServiceClient;
        this.contextResolverService = contextResolverService;
    }

    /**
     * Executes evidence-grounded statutory query with server-authorized context.
     *
     * @param request the user query, optional filters, and optional context reference
     * @param auth    the Spring Security authentication token (may be anonymous/null)
     * @return the structured response with authoritative citations and grounding status
     */
    public AssistantQueryResponseDTO query(AssistantQueryRequestDTO request, Authentication auth) {
        if (request == null || request.query() == null || request.query().trim().isBlank()) {
            throw new IllegalArgumentException("Query must not be blank.");
        }

        // 1. Resolve and authorize contextual references (if requested)
        AuthorizedAssistantContextDTO authorizedContext = null;
        if (request.context() != null && contextResolverService != null) {
            authorizedContext = contextResolverService.resolveAndAuthorize(request.context(), auth);
        }

        // 2. Enforce RBAC rules at search/retrieval boundary:
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

        // If authorized context targets specific document IDs (e.g. from Research Document or Snapshot Evidence),
        // constrain or prioritize retrieval to those authorized documents
        if (authorizedContext != null && authorizedContext.targetDocumentIds() != null && !authorizedContext.targetDocumentIds().isEmpty()) {
            allowedDocIds = authorizedContext.targetDocumentIds();
        }

        if (authorizedContext != null) {
            return aiServiceClient.queryAssistant(request, authorizedContext, onlyPublished, allowedDocIds);
        }
        return aiServiceClient.queryAssistant(request, onlyPublished, allowedDocIds);
    }
}
