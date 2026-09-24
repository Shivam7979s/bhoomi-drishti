package com.bhoomidrishti.governance.service;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.collaboration.service.CollaborationSecurityService;
import com.bhoomidrishti.exception.DuplicateEvidenceException;
import com.bhoomidrishti.exception.ResearchDocumentNotFoundException;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.governance.dto.CreateGovernanceSnapshotRequest;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorDefinitionResponse;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorEvidenceResponse;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorSnapshotResponse;
import com.bhoomidrishti.governance.dto.GovernanceScopeQuery;
import com.bhoomidrishti.governance.dto.LinkGovernanceEvidenceRequest;
import com.bhoomidrishti.governance.entity.GovernanceEvidenceType;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorDefinition;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorEvidence;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorSnapshot;
import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import com.bhoomidrishti.governance.entity.IndicatorCategory;
import com.bhoomidrishti.governance.entity.SnapshotVisibility;
import com.bhoomidrishti.governance.repository.GovernanceCalculationRepository;
import com.bhoomidrishti.governance.repository.GovernanceCalculationRepository.CalculationResult;
import com.bhoomidrishti.governance.repository.GovernanceIndicatorDefinitionRepository;
import com.bhoomidrishti.governance.repository.GovernanceIndicatorEvidenceRepository;
import com.bhoomidrishti.governance.repository.GovernanceIndicatorSnapshotRepository;
import com.bhoomidrishti.policy.repository.DocumentChunkQueryRepository;
import com.bhoomidrishti.policy.repository.DocumentChunkQueryRepository.DocumentChunkProvenance;
import com.bhoomidrishti.research.entity.ResearchDocument;
import com.bhoomidrishti.research.repository.ResearchDocumentRepository;
import com.bhoomidrishti.research.service.ResearchDocumentService;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class GovernanceIndicatorService {

    private final GovernanceIndicatorDefinitionRepository definitionRepository;
    private final GovernanceIndicatorSnapshotRepository snapshotRepository;
    private final GovernanceIndicatorEvidenceRepository evidenceRepository;
    private final GovernanceCalculationRepository calculationRepository;
    private final ProjectRepository projectRepository;
    private final ResearchDocumentRepository researchDocumentRepository;
    private final ResearchDocumentService researchDocumentService;
    private final DocumentChunkQueryRepository documentChunkQueryRepository;
    private final CollaborationSecurityService collaborationSecurityService;
    private final GovernanceQueryService governanceQueryService;

    public GovernanceIndicatorService(
            GovernanceIndicatorDefinitionRepository definitionRepository,
            GovernanceIndicatorSnapshotRepository snapshotRepository,
            GovernanceIndicatorEvidenceRepository evidenceRepository,
            GovernanceCalculationRepository calculationRepository,
            ProjectRepository projectRepository,
            ResearchDocumentRepository researchDocumentRepository,
            ResearchDocumentService researchDocumentService,
            DocumentChunkQueryRepository documentChunkQueryRepository,
            CollaborationSecurityService collaborationSecurityService) {
        this(
                definitionRepository,
                snapshotRepository,
                evidenceRepository,
                calculationRepository,
                projectRepository,
                researchDocumentRepository,
                researchDocumentService,
                documentChunkQueryRepository,
                collaborationSecurityService,
                new GovernanceQueryService(
                        calculationRepository,
                        definitionRepository,
                        snapshotRepository,
                        projectRepository,
                        collaborationSecurityService));
    }

    @org.springframework.beans.factory.annotation.Autowired
    public GovernanceIndicatorService(
            GovernanceIndicatorDefinitionRepository definitionRepository,
            GovernanceIndicatorSnapshotRepository snapshotRepository,
            GovernanceIndicatorEvidenceRepository evidenceRepository,
            GovernanceCalculationRepository calculationRepository,
            ProjectRepository projectRepository,
            ResearchDocumentRepository researchDocumentRepository,
            ResearchDocumentService researchDocumentService,
            DocumentChunkQueryRepository documentChunkQueryRepository,
            CollaborationSecurityService collaborationSecurityService,
            GovernanceQueryService governanceQueryService) {
        this.definitionRepository = definitionRepository;
        this.snapshotRepository = snapshotRepository;
        this.evidenceRepository = evidenceRepository;
        this.calculationRepository = calculationRepository;
        this.projectRepository = projectRepository;
        this.researchDocumentRepository = researchDocumentRepository;
        this.researchDocumentService = researchDocumentService;
        this.documentChunkQueryRepository = documentChunkQueryRepository;
        this.collaborationSecurityService = collaborationSecurityService;
        this.governanceQueryService = governanceQueryService;
    }

    // -------------------------------------------------------------------------
    // Indicator Definitions (Read-Only metadata)
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<GovernanceIndicatorDefinitionResponse> getIndicatorDefinitions(IndicatorCategory category) {
        List<GovernanceIndicatorDefinition> definitions;
        if (category != null) {
            definitions = definitionRepository.findByCategory(category);
        } else {
            definitions = definitionRepository.findByActiveTrueOrderByCategoryAscNameAsc();
        }
        return definitions.stream()
                .map(GovernanceIndicatorDefinitionResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public GovernanceIndicatorDefinitionResponse getIndicatorDefinitionByCode(String code) {
        GovernanceIndicatorDefinition def = definitionRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Indicator definition not found: " + code));
        return GovernanceIndicatorDefinitionResponse.fromEntity(def);
    }

    // -------------------------------------------------------------------------
    // Indicator Snapshots (Deterministic calculation outputs)
    // -------------------------------------------------------------------------

    public GovernanceIndicatorSnapshotResponse createSnapshot(
            CreateGovernanceSnapshotRequest request, Authentication auth) {
        User user = collaborationSecurityService.requireAuthenticatedUser(auth);

        GovernanceIndicatorDefinition definition = governanceQueryService.validateIndicator(request.indicatorCode());
        GovernanceScopeQuery scopeQuery = new GovernanceScopeQuery(
                request.scopeType(),
                request.state(),
                request.district(),
                request.tehsil(),
                request.village(),
                request.projectId());
        governanceQueryService.validateScope(scopeQuery);

        // Scope validation & authorization
        Project project = null;
        if (request.scopeType() == GovernanceScopeType.PROJECT) {
            project = projectRepository.findById(request.projectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + request.projectId()));
            collaborationSecurityService.checkCanContributeToProject(project, user);
        } else {
            if (user.getRole() != Role.GOVERNMENT_OFFICIAL && user.getRole() != Role.ADMIN) {
                throw new AccessDeniedException("Only GOVERNMENT_OFFICIAL or ADMIN can create regional governance snapshots");
            }
        }

        if (request.periodStart() != null && request.periodEnd() != null
                && request.periodEnd().isBefore(request.periodStart())) {
            throw new IllegalArgumentException("periodEnd cannot be before periodStart");
        }

        // Deterministic backend calculation directly from land records
        CalculationResult calc = calculationRepository.calculateIndicator(
                definition.getCode(),
                request.scopeType(),
                request.state(),
                request.district(),
                request.tehsil(),
                request.village(),
                project != null ? project.getId() : null);

        Instant asOf = request.asOf() != null ? request.asOf() : Instant.now();

        SnapshotVisibility visibility = request.visibility() != null ? request.visibility() : SnapshotVisibility.INTERNAL;
        if (visibility == SnapshotVisibility.PUBLISHED && request.scopeType() != GovernanceScopeType.PROJECT) {
            if (user.getRole() != Role.GOVERNMENT_OFFICIAL && user.getRole() != Role.ADMIN) {
                throw new AccessDeniedException("Only GOVERNMENT_OFFICIAL or ADMIN can publish regional governance snapshots");
            }
        }

        GovernanceIndicatorSnapshot snapshot = new GovernanceIndicatorSnapshot(
                definition,
                project,
                request.scopeType(),
                request.state(),
                request.district(),
                request.tehsil(),
                request.village(),
                visibility,
                asOf,
                request.periodStart(),
                request.periodEnd(),
                calc.numericValue(),
                calc.denominator(),
                calc.breakdownJson(),
                definition.getCalculationVersion(),
                calc.sourceDataTimestamp(),
                request.sourceDataVersion(),
                user);

        GovernanceIndicatorSnapshot saved = snapshotRepository.save(snapshot);
        return GovernanceIndicatorSnapshotResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public GovernanceIndicatorSnapshotResponse getSnapshotById(UUID snapshotId, Authentication auth) {
        GovernanceIndicatorSnapshot snapshot = snapshotRepository.findById(snapshotId)
                .orElseThrow(() -> new ResourceNotFoundException("Governance snapshot not found: " + snapshotId));

        checkSnapshotViewAccess(snapshot, auth);

        return GovernanceIndicatorSnapshotResponse.fromEntity(snapshot);
    }

    @Transactional(readOnly = true)
    public List<GovernanceIndicatorSnapshotResponse> getSnapshotsByProject(UUID projectId, Authentication auth) {
        User user = collaborationSecurityService.resolveCurrentUser(auth).orElse(null);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        collaborationSecurityService.checkCanViewProject(project, user);

        return snapshotRepository.findByProjectIdOrderByAsOfDesc(projectId).stream()
                .map(GovernanceIndicatorSnapshotResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GovernanceIndicatorSnapshotResponse> getSnapshotsByScope(
            GovernanceScopeType scopeType,
            String state,
            String district,
            String tehsil,
            String village,
            String indicatorCode,
            Authentication auth) {
        GovernanceScopeQuery scopeQuery = new GovernanceScopeQuery(scopeType, state, district, tehsil, village, null);
        List<GovernanceIndicatorSnapshot> snapshots = governanceQueryService.queryPersistedSnapshots(scopeQuery, indicatorCode, auth);
        return snapshots.stream()
                .map(GovernanceIndicatorSnapshotResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GovernanceIndicatorSnapshotResponse> getSnapshotsByScope(
            GovernanceScopeType scopeType, String state, String district, Authentication auth) {
        return getSnapshotsByScope(scopeType, state, district, null, null, null, auth);
    }

    // -------------------------------------------------------------------------
    // Governance Evidence & Provenance Linking
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<GovernanceIndicatorEvidenceResponse> getSnapshotEvidence(UUID snapshotId, Authentication auth) {
        GovernanceIndicatorSnapshot snapshot = snapshotRepository.findById(snapshotId)
                .orElseThrow(() -> new ResourceNotFoundException("Governance snapshot not found: " + snapshotId));

        checkSnapshotViewAccess(snapshot, auth);

        List<GovernanceIndicatorEvidence> evidenceList = evidenceRepository.findBySnapshotIdOrderByLinkedAtDesc(snapshotId);
        if (evidenceList.isEmpty()) {
            return List.of();
        }

        Set<UUID> chunkIds = evidenceList.stream()
                .map(GovernanceIndicatorEvidence::getDocumentChunkId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, DocumentChunkProvenance> provenanceMap = chunkIds.isEmpty()
                ? Map.of()
                : documentChunkQueryRepository.findProvenanceByIds(chunkIds);

        return evidenceList.stream()
                .map(ev -> {
                    if (ev.getDocumentChunkId() != null && provenanceMap.containsKey(ev.getDocumentChunkId())) {
                        DocumentChunkProvenance prov = provenanceMap.get(ev.getDocumentChunkId());
                        return GovernanceIndicatorEvidenceResponse.fromEntityWithChunk(
                                ev, prov.text(), prov.pageNumber(), prov.sectionTitle());
                    }
                    return GovernanceIndicatorEvidenceResponse.fromEntity(ev);
                })
                .toList();
    }

    public GovernanceIndicatorEvidenceResponse linkEvidence(
            UUID snapshotId, LinkGovernanceEvidenceRequest request, Authentication auth) {
        User user = collaborationSecurityService.requireAuthenticatedUser(auth);

        GovernanceIndicatorSnapshot snapshot = snapshotRepository.findById(snapshotId)
                .orElseThrow(() -> new ResourceNotFoundException("Governance snapshot not found: " + snapshotId));

        // Authorization check
        if (snapshot.getProject() != null) {
            collaborationSecurityService.checkCanContributeToProject(snapshot.getProject(), user);
        } else {
            if (user.getRole() != Role.GOVERNMENT_OFFICIAL && user.getRole() != Role.ADMIN) {
                throw new AccessDeniedException("Only GOVERNMENT_OFFICIAL or ADMIN can link evidence to regional snapshots");
            }
        }

        if (request.researchDocumentId() == null && request.documentChunkId() == null) {
            throw new IllegalArgumentException("At least one of researchDocumentId or documentChunkId must be provided");
        }

        ResearchDocument document = null;
        UUID chunkId = request.documentChunkId();

        if (request.researchDocumentId() != null) {
            document = researchDocumentRepository.findById(request.researchDocumentId())
                    .orElseThrow(() -> new ResearchDocumentNotFoundException(request.researchDocumentId()));

            if (!researchDocumentService.canRead(document, auth)) {
                throw new ResearchDocumentNotFoundException(request.researchDocumentId());
            }
        }

        if (chunkId != null) {
            DocumentChunkProvenance prov = documentChunkQueryRepository.findProvenanceById(chunkId)
                    .orElseThrow(() -> new IllegalArgumentException("Document chunk not found: " + chunkId));

            if (document != null && !document.getId().equals(prov.researchDocumentId())) {
                throw new IllegalArgumentException(String.format(
                        "Document chunk %s does not belong to research document %s",
                        chunkId, document.getId()));
            }

            if (document == null) {
                document = researchDocumentRepository.findById(prov.researchDocumentId())
                        .orElseThrow(() -> new ResearchDocumentNotFoundException(prov.researchDocumentId()));
                if (!researchDocumentService.canRead(document, auth)) {
                    throw new ResearchDocumentNotFoundException(prov.researchDocumentId());
                }
            }
        }

        UUID resolvedDocId = document != null ? document.getId() : null;
        if (evidenceRepository.existsBySnapshotIdAndResearchDocumentIdAndDocumentChunkIdAndEvidenceType(
                snapshotId, resolvedDocId, chunkId, request.evidenceType())) {
            throw new DuplicateEvidenceException(
                    "This evidence target has already been linked to this snapshot under evidence type: "
                            + request.evidenceType());
        }

        GovernanceIndicatorEvidence evidence = new GovernanceIndicatorEvidence(
                snapshot,
                document,
                chunkId,
                request.evidenceType(),
                request.rationale(),
                request.similarityScore(),
                user);

        GovernanceIndicatorEvidence saved = evidenceRepository.save(evidence);

        if (chunkId != null) {
            DocumentChunkProvenance prov = documentChunkQueryRepository.findProvenanceById(chunkId).orElse(null);
            if (prov != null) {
                return GovernanceIndicatorEvidenceResponse.fromEntityWithChunk(
                        saved, prov.text(), prov.pageNumber(), prov.sectionTitle());
            }
        }

        return GovernanceIndicatorEvidenceResponse.fromEntity(saved);
    }

    public void unlinkEvidence(UUID snapshotId, UUID evidenceId, Authentication auth) {
        User user = collaborationSecurityService.requireAuthenticatedUser(auth);

        GovernanceIndicatorSnapshot snapshot = snapshotRepository.findById(snapshotId)
                .orElseThrow(() -> new ResourceNotFoundException("Governance snapshot not found: " + snapshotId));

        if (snapshot.getProject() != null) {
            collaborationSecurityService.checkCanContributeToProject(snapshot.getProject(), user);
        } else {
            if (user.getRole() != Role.GOVERNMENT_OFFICIAL && user.getRole() != Role.ADMIN) {
                throw new AccessDeniedException("Only GOVERNMENT_OFFICIAL or ADMIN can unlink evidence from regional snapshots");
            }
        }

        GovernanceIndicatorEvidence evidence = evidenceRepository.findByIdAndSnapshotId(evidenceId, snapshotId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Evidence not found with id " + evidenceId + " for snapshot " + snapshotId));

        evidenceRepository.delete(evidence);
    }

    private void checkSnapshotViewAccess(GovernanceIndicatorSnapshot snapshot, Authentication auth) {
        User user = collaborationSecurityService.resolveCurrentUser(auth).orElse(null);
        if (snapshot.getProject() != null) {
            collaborationSecurityService.checkCanViewProject(snapshot.getProject(), user);
        } else {
            if (snapshot.getVisibility() != SnapshotVisibility.PUBLISHED) {
                boolean isOfficialOrAdmin = user != null && (user.getRole() == Role.GOVERNMENT_OFFICIAL || user.getRole() == Role.ADMIN);
                if (!isOfficialOrAdmin) {
                    throw new ResourceNotFoundException("Governance snapshot not found: " + snapshot.getId());
                }
            }
        }
    }

    private void validateRegionalScope(CreateGovernanceSnapshotRequest request) {
        switch (request.scopeType()) {
            case STATE -> {
                if (request.state() == null || request.state().isBlank()) {
                    throw new IllegalArgumentException("state is required for STATE scope type");
                }
            }
            case DISTRICT -> {
                if (request.state() == null || request.state().isBlank()
                        || request.district() == null || request.district().isBlank()) {
                    throw new IllegalArgumentException("state and district are required for DISTRICT scope type");
                }
            }
            case TEHSIL -> {
                if (request.state() == null || request.state().isBlank()
                        || request.district() == null || request.district().isBlank()
                        || request.tehsil() == null || request.tehsil().isBlank()) {
                    throw new IllegalArgumentException("state, district, and tehsil are required for TEHSIL scope type");
                }
            }
            case VILLAGE -> {
                if (request.state() == null || request.state().isBlank()
                        || request.district() == null || request.district().isBlank()
                        || request.tehsil() == null || request.tehsil().isBlank()
                        || request.village() == null || request.village().isBlank()) {
                    throw new IllegalArgumentException("state, district, tehsil, and village are required for VILLAGE scope type");
                }
            }
            default -> {}
        }
    }
}
