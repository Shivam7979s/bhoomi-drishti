package com.bhoomidrishti.knowledge.service;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.common.EmailNormalizer;
import com.bhoomidrishti.exception.DuplicateIngestionException;
import com.bhoomidrishti.exception.ResearchDocumentNotFoundException;
import com.bhoomidrishti.knowledge.client.AiServiceClient;
import com.bhoomidrishti.knowledge.dto.DocumentProcessingStatusResponse;
import com.bhoomidrishti.knowledge.dto.IngestDocumentResponse;
import com.bhoomidrishti.knowledge.dto.KnowledgeSearchRequest;
import com.bhoomidrishti.knowledge.dto.KnowledgeSearchResponse;
import com.bhoomidrishti.knowledge.entity.DocumentProcessing;
import com.bhoomidrishti.knowledge.entity.ProcessingStatus;
import com.bhoomidrishti.knowledge.repository.DocumentProcessingRepository;
import com.bhoomidrishti.research.entity.ResearchDocument;
import com.bhoomidrishti.research.entity.ResearchDocumentStatus;
import com.bhoomidrishti.research.repository.ResearchDocumentRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class KnowledgeService {

    private final AiServiceClient aiServiceClient;
    private final ResearchDocumentRepository researchDocumentRepository;
    private final DocumentProcessingRepository documentProcessingRepository;
    private final UserRepository userRepository;

    public KnowledgeService(
            AiServiceClient aiServiceClient,
            ResearchDocumentRepository researchDocumentRepository,
            DocumentProcessingRepository documentProcessingRepository,
            UserRepository userRepository) {
        this.aiServiceClient = aiServiceClient;
        this.researchDocumentRepository = researchDocumentRepository;
        this.documentProcessingRepository = documentProcessingRepository;
        this.userRepository = userRepository;
    }

    public KnowledgeSearchResponse search(KnowledgeSearchRequest request, Authentication auth) {
        // Enforce RBAC rules at search boundary:
        // PUBLIC / Unauthenticated users can ONLY retrieve evidence from PUBLISHED documents.
        boolean onlyPublished = true;
        List<UUID> allowedDocIds = null;

        if (auth != null && auth.isAuthenticated()) {
            boolean isAdminOrGov = auth.getAuthorities().stream().anyMatch(a ->
                    a.getAuthority().equals(Role.ADMIN.authority())
                            || a.getAuthority().equals(Role.GOVERNMENT_OFFICIAL.authority()));

            if (isAdminOrGov) {
                // Admin and Government Officials can search across all document statuses
                onlyPublished = false;
            }
        }

        return aiServiceClient.search(request, onlyPublished, allowedDocIds);
    }

    @Transactional
    public IngestDocumentResponse triggerIngest(UUID documentId, Authentication auth) {
        assertCanIngest(auth);

        ResearchDocument doc = researchDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResearchDocumentNotFoundException(documentId));

        assertOwnershipOrAuthority(doc, auth);

        boolean hasFile = doc.getFileUrl() != null && !doc.getFileUrl().isBlank();
        boolean hasSource = doc.getSourceUrl() != null && !doc.getSourceUrl().isBlank();
        if (!hasFile && !hasSource) {
            throw new IllegalArgumentException(
                    "Cannot ingest document: both fileUrl and sourceUrl are missing."
            );
        }

        // Prevent parallel concurrent ingestion runs
        boolean inProgress = documentProcessingRepository.existsByResearchDocumentIdAndStatusIn(
                documentId,
                List.of(ProcessingStatus.QUEUED, ProcessingStatus.PROCESSING)
        );
        if (inProgress) {
            throw new DuplicateIngestionException(
                    "Ingestion is already in progress for document: " + documentId
            );
        }

        return aiServiceClient.triggerIngest(documentId, doc.getFileUrl(), doc.getSourceUrl(), null);
    }

    @Transactional(readOnly = true)
    public DocumentProcessingStatusResponse getProcessingStatus(UUID documentId, Authentication auth) {
        ResearchDocument doc = researchDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResearchDocumentNotFoundException(documentId));

        // Public users can only see processing status for PUBLISHED documents
        boolean isPublic = (auth == null || !auth.isAuthenticated() || auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(Role.PUBLIC.authority())));
        if (isPublic && doc.getStatus() != ResearchDocumentStatus.PUBLISHED) {
            throw new ResearchDocumentNotFoundException(documentId);
        }

        Optional<DocumentProcessing> record = documentProcessingRepository.findByResearchDocumentId(documentId);
        if (record.isPresent()) {
            DocumentProcessing p = record.get();
            return new DocumentProcessingStatusResponse(
                    p.getId(),
                    doc.getId(),
                    p.getStatus(),
                    p.getErrorMessage(),
                    p.getChunkCount(),
                    p.getContentHash(),
                    p.getProcessingVersion(),
                    p.getStartedAt(),
                    p.getCompletedAt()
            );
        }

        // Fallback to checking AI service
        DocumentProcessingStatusResponse aiStatus = aiServiceClient.getStatus(documentId);
        return aiStatus != null ? aiStatus : DocumentProcessingStatusResponse.notIngested(documentId);
    }

    private void assertCanIngest(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required to ingest documents");
        }
        boolean allowed = auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(Role.ADMIN.authority())
                        || a.getAuthority().equals(Role.GOVERNMENT_OFFICIAL.authority())
                        || a.getAuthority().equals(Role.RESEARCHER.authority())
                        || a.getAuthority().equals(Role.ACADEMIA.authority()));
        if (!allowed) {
            throw new AccessDeniedException("Insufficient permissions to trigger document ingestion");
        }
    }

    private void assertOwnershipOrAuthority(ResearchDocument doc, Authentication auth) {
        boolean isOfficialOrAdmin = auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(Role.ADMIN.authority())
                        || a.getAuthority().equals(Role.GOVERNMENT_OFFICIAL.authority()));
        if (isOfficialOrAdmin) {
            return;
        }

        // RESEARCHER and ACADEMIA can only ingest documents they authored
        boolean isResearcherOrAcademia = auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(Role.RESEARCHER.authority())
                        || a.getAuthority().equals(Role.ACADEMIA.authority()));
        if (isResearcherOrAcademia) {
            UUID currentUserId = resolveUserId(auth).orElse(null);
            if (currentUserId != null
                    && doc.getCreatedBy() != null
                    && doc.getCreatedBy().getId().equals(currentUserId)) {
                return;
            }
            throw new AccessDeniedException("You can only ingest research documents you created");
        }

        throw new AccessDeniedException("Insufficient permissions to ingest this document");
    }

    public Optional<UUID> resolveUserId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        if (auth.getPrincipal() instanceof User user) {
            return Optional.ofNullable(user.getId());
        }
        if (auth.getPrincipal() instanceof UserDetails userDetails) {
            return userRepository.findByEmail(EmailNormalizer.normalize(userDetails.getUsername()))
                    .map(User::getId);
        }
        if (auth.getName() != null) {
            return userRepository.findByEmail(EmailNormalizer.normalize(auth.getName()))
                    .map(User::getId);
        }
        return Optional.empty();
    }
}
