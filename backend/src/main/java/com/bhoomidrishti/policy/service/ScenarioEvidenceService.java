package com.bhoomidrishti.policy.service;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.service.CollaborationSecurityService;
import com.bhoomidrishti.exception.DuplicateEvidenceException;
import com.bhoomidrishti.exception.ResearchDocumentNotFoundException;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.knowledge.dto.KnowledgeSearchRequest;
import com.bhoomidrishti.knowledge.dto.KnowledgeSearchResponse;
import com.bhoomidrishti.knowledge.service.KnowledgeService;
import com.bhoomidrishti.policy.dto.LinkScenarioEvidenceRequest;
import com.bhoomidrishti.policy.dto.ScenarioEvidenceResponse;
import com.bhoomidrishti.policy.entity.PolicyScenario;
import com.bhoomidrishti.policy.entity.ScenarioEvidence;
import com.bhoomidrishti.policy.entity.ScenarioStatus;
import com.bhoomidrishti.policy.repository.DocumentChunkQueryRepository;
import com.bhoomidrishti.policy.repository.DocumentChunkQueryRepository.DocumentChunkProvenance;
import com.bhoomidrishti.policy.repository.PolicyScenarioRepository;
import com.bhoomidrishti.policy.repository.ScenarioEvidenceRepository;
import com.bhoomidrishti.research.entity.ResearchDocument;
import com.bhoomidrishti.research.repository.ResearchDocumentRepository;
import com.bhoomidrishti.research.service.ResearchDocumentService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service managing policy scenario evidence links and provenance verification.
 *
 * <p>Enforces strict provenance chains:
 * <pre>
 *   PolicyScenario -> ScenarioEvidence -> ResearchDocument [-> DocumentChunk]
 * </pre>
 *
 * <p><strong>Key Invariants:</strong>
 * <ul>
 *   <li>Only project contributors or leads can link or unlink evidence.</li>
 *   <li>Scenario must not be ARCHIVED.</li>
 *   <li>ResearchDocument must be accessible according to Phase 4 visibility rules.</li>
 *   <li>If a DocumentChunk is specified, it must exist and belong to the specified ResearchDocument.</li>
 *   <li>Duplicate evidence across (scenario, document, chunk, type) is rejected with 409 Conflict.</li>
 *   <li>Search candidates reuses Phase 5 knowledge search and does NOT mutate or persist evidence.</li>
 * </ul>
 */
@Service
@Transactional
public class ScenarioEvidenceService {

    private final PolicyScenarioRepository scenarioRepository;
    private final ScenarioEvidenceRepository scenarioEvidenceRepository;
    private final ResearchDocumentRepository researchDocumentRepository;
    private final ResearchDocumentService researchDocumentService;
    private final DocumentChunkQueryRepository documentChunkQueryRepository;
    private final KnowledgeService knowledgeService;
    private final CollaborationSecurityService collaborationSecurityService;

    public ScenarioEvidenceService(
            PolicyScenarioRepository scenarioRepository,
            ScenarioEvidenceRepository scenarioEvidenceRepository,
            ResearchDocumentRepository researchDocumentRepository,
            ResearchDocumentService researchDocumentService,
            DocumentChunkQueryRepository documentChunkQueryRepository,
            KnowledgeService knowledgeService,
            CollaborationSecurityService collaborationSecurityService
    ) {
        this.scenarioRepository = scenarioRepository;
        this.scenarioEvidenceRepository = scenarioEvidenceRepository;
        this.researchDocumentRepository = researchDocumentRepository;
        this.researchDocumentService = researchDocumentService;
        this.documentChunkQueryRepository = documentChunkQueryRepository;
        this.knowledgeService = knowledgeService;
        this.collaborationSecurityService = collaborationSecurityService;
    }

    /**
     * Links a research document or specific chunk as evidence to a policy scenario.
     */
    public ScenarioEvidenceResponse linkEvidence(UUID scenarioId, LinkScenarioEvidenceRequest request, Authentication auth) {
        User user = collaborationSecurityService.requireAuthenticatedUser(auth);
        return linkEvidenceInternal(scenarioId, request, user, auth);
    }

    /**
     * Programmatic overload for linking evidence by User entity.
     */
    public ScenarioEvidenceResponse linkEvidence(UUID scenarioId, LinkScenarioEvidenceRequest request, User user) {
        if (user == null) {
            throw new AccessDeniedException("Authentication required");
        }
        Authentication auth = buildAuthentication(user, null);
        return linkEvidenceInternal(scenarioId, request, user, auth);
    }

    private ScenarioEvidenceResponse linkEvidenceInternal(
            UUID scenarioId,
            LinkScenarioEvidenceRequest request,
            User user,
            Authentication auth
    ) {
        // 1. Scenario lookup
        PolicyScenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found: " + scenarioId));

        // 2. Authorization check
        collaborationSecurityService.checkCanContributeToProject(scenario.getProject(), user);

        // 3. Lifecycle check
        if (scenario.getStatus() == ScenarioStatus.ARCHIVED) {
            throw new IllegalStateException("Cannot add evidence to an archived scenario");
        }

        // 4. Research Document lookup & visibility check
        ResearchDocument document = researchDocumentRepository.findById(request.researchDocumentId())
                .orElseThrow(() -> new ResearchDocumentNotFoundException(request.researchDocumentId()));

        if (!researchDocumentService.canRead(document, auth)) {
            // Throw 404 to avoid leaking existence of DRAFT or restricted documents
            throw new ResearchDocumentNotFoundException(request.researchDocumentId());
        }

        // 5. Document chunk provenance validation
        DocumentChunkProvenance chunkProvenance = null;
        if (request.documentChunkId() != null) {
            chunkProvenance = documentChunkQueryRepository.findProvenanceById(request.documentChunkId())
                    .orElseThrow(() -> new ResourceNotFoundException("Document chunk not found: " + request.documentChunkId()));

            if (!chunkProvenance.researchDocumentId().equals(request.researchDocumentId())) {
                throw new IllegalArgumentException(
                        "Document chunk " + request.documentChunkId() +
                        " does not belong to research document " + request.researchDocumentId()
                );
            }
        }

        // 6. Similarity score validation
        BigDecimal score = request.similarityScore();
        if (score != null) {
            if (score.compareTo(BigDecimal.valueOf(-1)) < 0 || score.compareTo(BigDecimal.ONE) > 0) {
                throw new IllegalArgumentException("Similarity score must be between -1.0000 and 1.0000");
            }
            score = score.setScale(4, RoundingMode.HALF_UP);
        }

        // 7. Duplicate prevention
        if (scenarioEvidenceRepository.existsDuplicateEvidence(
                scenarioId,
                request.researchDocumentId(),
                request.documentChunkId(),
                request.evidenceType()
        )) {
            throw new DuplicateEvidenceException(
                    "Evidence of type " + request.evidenceType() + " is already linked to this scenario"
            );
        }

        // 8. Create and persist ScenarioEvidence
        ScenarioEvidence evidence = new ScenarioEvidence(
                scenario,
                document,
                request.documentChunkId(),
                request.evidenceType(),
                request.rationale(),
                score,
                user
        );
        ScenarioEvidence saved = scenarioEvidenceRepository.save(evidence);

        return ScenarioEvidenceResponse.from(saved, chunkProvenance);
    }

    /**
     * Retrieves all evidence linked to a policy scenario.
     */
    @Transactional(readOnly = true)
    public List<ScenarioEvidenceResponse> getScenarioEvidence(UUID scenarioId, Authentication auth) {
        User user = collaborationSecurityService.resolveCurrentUser(auth).orElse(null);
        return getScenarioEvidenceInternal(scenarioId, user, auth);
    }

    /**
     * Programmatic overload for retrieving scenario evidence by User entity.
     */
    @Transactional(readOnly = true)
    public List<ScenarioEvidenceResponse> getScenarioEvidence(UUID scenarioId, User user) {
        Authentication auth = buildAuthentication(user, null);
        return getScenarioEvidenceInternal(scenarioId, user, auth);
    }

    private List<ScenarioEvidenceResponse> getScenarioEvidenceInternal(
            UUID scenarioId,
            User user,
            Authentication auth
    ) {
        PolicyScenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found: " + scenarioId));

        // Multi-tenant check: project visibility
        collaborationSecurityService.checkCanViewProject(scenario.getProject(), user);

        List<ScenarioEvidence> evidenceList = scenarioEvidenceRepository.findByScenarioIdOrderByLinkedAtDesc(scenarioId);
        if (evidenceList.isEmpty()) {
            return List.of();
        }

        // Batch resolve chunk provenance snippets
        Set<UUID> chunkIds = evidenceList.stream()
                .map(ScenarioEvidence::getDocumentChunkId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, DocumentChunkProvenance> chunkMap = chunkIds.isEmpty()
                ? Map.of()
                : documentChunkQueryRepository.findProvenanceByIds(chunkIds);

        Authentication effectiveAuth = buildAuthentication(user, auth);

        return evidenceList.stream()
                .filter(e -> e.getResearchDocument() == null || researchDocumentService.canRead(e.getResearchDocument(), effectiveAuth))
                .map(e -> ScenarioEvidenceResponse.from(
                        e,
                        e.getDocumentChunkId() != null ? chunkMap.get(e.getDocumentChunkId()) : null
                ))
                .toList();
    }

    /**
     * Removes an evidence link from a policy scenario.
     */
    public void unlinkEvidence(UUID scenarioId, UUID evidenceId, Authentication auth) {
        User user = collaborationSecurityService.requireAuthenticatedUser(auth);
        unlinkEvidenceInternal(scenarioId, evidenceId, user);
    }

    /**
     * Programmatic overload for unlinking evidence by User entity.
     */
    public void unlinkEvidence(UUID scenarioId, UUID evidenceId, User user) {
        if (user == null) {
            throw new AccessDeniedException("Authentication required");
        }
        unlinkEvidenceInternal(scenarioId, evidenceId, user);
    }

    private void unlinkEvidenceInternal(UUID scenarioId, UUID evidenceId, User user) {
        PolicyScenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found: " + scenarioId));

        collaborationSecurityService.checkCanContributeToProject(scenario.getProject(), user);

        if (scenario.getStatus() == ScenarioStatus.ARCHIVED) {
            throw new IllegalStateException("Cannot unlink evidence from an archived scenario");
        }

        ScenarioEvidence evidence = scenarioEvidenceRepository.findByIdAndScenarioId(evidenceId, scenarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Scenario evidence not found: " + evidenceId));

        scenarioEvidenceRepository.delete(evidence);
    }

    /**
     * Searches for candidate evidence items from the knowledge base without persisting them.
     */
    @Transactional(readOnly = true)
    public KnowledgeSearchResponse searchEvidenceCandidates(
            UUID scenarioId,
            KnowledgeSearchRequest request,
            Authentication auth
    ) {
        User user = collaborationSecurityService.requireAuthenticatedUser(auth);

        PolicyScenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found: " + scenarioId));

        collaborationSecurityService.checkCanViewProject(scenario.getProject(), user);

        return knowledgeService.search(request, auth);
    }

    private Authentication buildAuthentication(User user, Authentication auth) {
        if (auth != null) {
            return auth;
        }
        if (user != null) {
            String roleName = user.getRole() != null ? user.getRole().name() : "USER";
            return new UsernamePasswordAuthenticationToken(
                    user,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + roleName))
            );
        }
        return null;
    }
}
