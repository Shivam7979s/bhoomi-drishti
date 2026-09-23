package com.bhoomidrishti.policy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.ProjectVisibility;
import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import com.bhoomidrishti.collaboration.service.CollaborationSecurityService;
import com.bhoomidrishti.exception.DuplicateEvidenceException;
import com.bhoomidrishti.exception.ResearchDocumentNotFoundException;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.knowledge.dto.EvidenceItemResponse;
import com.bhoomidrishti.knowledge.dto.KnowledgeSearchRequest;
import com.bhoomidrishti.knowledge.dto.KnowledgeSearchResponse;
import com.bhoomidrishti.knowledge.service.KnowledgeService;
import com.bhoomidrishti.policy.dto.LinkScenarioEvidenceRequest;
import com.bhoomidrishti.policy.dto.ScenarioEvidenceResponse;
import com.bhoomidrishti.policy.entity.EvidenceType;
import com.bhoomidrishti.policy.entity.PolicyScenario;
import com.bhoomidrishti.policy.entity.ScenarioEvidence;
import com.bhoomidrishti.policy.entity.ScenarioStatus;
import com.bhoomidrishti.policy.entity.ScenarioType;
import com.bhoomidrishti.policy.repository.DocumentChunkQueryRepository;
import com.bhoomidrishti.policy.repository.DocumentChunkQueryRepository.DocumentChunkProvenance;
import com.bhoomidrishti.policy.repository.PolicyScenarioRepository;
import com.bhoomidrishti.policy.repository.ScenarioEvidenceRepository;
import com.bhoomidrishti.policy.service.ScenarioEvidenceService;
import com.bhoomidrishti.research.entity.DocumentType;
import com.bhoomidrishti.research.entity.ResearchDocument;
import com.bhoomidrishti.research.entity.ResearchDocumentStatus;
import com.bhoomidrishti.research.repository.ResearchDocumentRepository;
import com.bhoomidrishti.research.service.ResearchDocumentService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ScenarioEvidenceServiceTest {

    @Mock
    private PolicyScenarioRepository scenarioRepository;
    @Mock
    private ScenarioEvidenceRepository scenarioEvidenceRepository;
    @Mock
    private ResearchDocumentRepository researchDocumentRepository;
    @Mock
    private ResearchDocumentService researchDocumentService;
    @Mock
    private DocumentChunkQueryRepository documentChunkQueryRepository;
    @Mock
    private KnowledgeService knowledgeService;
    @Mock
    private CollaborationSecurityService collaborationSecurityService;

    private ScenarioEvidenceService service;

    private User leadUser;
    private Project project;
    private PolicyScenario scenario;
    private ResearchDocument researchDoc;
    private UUID scenarioId;
    private UUID docId;
    private UUID chunkId;

    @BeforeEach
    void setUp() {
        service = new ScenarioEvidenceService(
                scenarioRepository,
                scenarioEvidenceRepository,
                researchDocumentRepository,
                researchDocumentService,
                documentChunkQueryRepository,
                knowledgeService,
                collaborationSecurityService
        );

        leadUser = User.registerLocal("Dr. Lead", "lead@example.com", "hash");
        ReflectionTestUtils.setField(leadUser, "id", UUID.randomUUID());
        leadUser.changeRole(Role.RESEARCHER);

        Workspace ws = new Workspace(
                "Gov WS",
                "gov-ws",
                "Workspace for governance",
                "MoHUA",
                WorkspaceVisibility.PUBLIC,
                leadUser
        );
        ReflectionTestUtils.setField(ws, "id", UUID.randomUUID());

        project = new Project(
                ws,
                "Rezoning Project",
                "rezoning-project",
                "Rezoning evaluation project",
                ProjectVisibility.PUBLIC,
                leadUser
        );
        ReflectionTestUtils.setField(project, "id", UUID.randomUUID());

        scenarioId = UUID.randomUUID();
        scenario = new PolicyScenario(
                project,
                leadUser,
                "Urban Rezoning 2026",
                "urban-rezoning-2026",
                "Simulating 20% agricultural conversion",
                ScenarioType.LAND_USE_CONVERSION
        );
        ReflectionTestUtils.setField(scenario, "id", scenarioId);

        docId = UUID.randomUUID();
        researchDoc = new ResearchDocument(
                "Agricultural Land Preservation Guidelines",
                "Statutory guidelines description",
                DocumentType.POLICY_DOCUMENT,
                "Ministry of Agriculture",
                "Gov",
                LocalDate.of(2023, 1, 1),
                null,
                null,
                "en",
                "agriculture,preservation",
                "Abstract",
                ResearchDocumentStatus.PUBLISHED,
                leadUser
        );
        ReflectionTestUtils.setField(researchDoc, "id", docId);

        chunkId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Successfully link document-level evidence without chunk")
    void linkEvidence_DocumentLevel_Success() {
        LinkScenarioEvidenceRequest request = new LinkScenarioEvidenceRequest(
                docId,
                null,
                EvidenceType.STATUTORY_AUTHORITY,
                "Statutory basis for agricultural re-zoning quotas",
                new BigDecimal("0.8500")
        );

        when(scenarioRepository.findById(scenarioId)).thenReturn(Optional.of(scenario));
        when(researchDocumentRepository.findById(docId)).thenReturn(Optional.of(researchDoc));
        when(researchDocumentService.canRead(eq(researchDoc), any())).thenReturn(true);
        when(scenarioEvidenceRepository.existsDuplicateEvidence(scenarioId, docId, null, EvidenceType.STATUTORY_AUTHORITY))
                .thenReturn(false);

        when(scenarioEvidenceRepository.save(any(ScenarioEvidence.class))).thenAnswer(inv -> {
            ScenarioEvidence se = inv.getArgument(0);
            ReflectionTestUtils.setField(se, "id", UUID.randomUUID());
            ReflectionTestUtils.setField(se, "linkedAt", Instant.now());
            return se;
        });

        ScenarioEvidenceResponse response = service.linkEvidence(scenarioId, request, leadUser);

        assertThat(response).isNotNull();
        assertThat(response.scenarioId()).isEqualTo(scenarioId);
        assertThat(response.researchDocumentId()).isEqualTo(docId);
        assertThat(response.documentTitle()).isEqualTo("Agricultural Land Preservation Guidelines");
        assertThat(response.documentChunkId()).isNull();
        assertThat(response.chunkText()).isNull();
        assertThat(response.evidenceType()).isEqualTo(EvidenceType.STATUTORY_AUTHORITY);
        assertThat(response.similarityScore()).isEqualByComparingTo("0.8500");
        assertThat(response.linkedById()).isEqualTo(leadUser.getId());

        verify(collaborationSecurityService).checkCanContributeToProject(project, leadUser);
    }

    @Test
    @DisplayName("Successfully link chunk-level evidence with verified provenance")
    void linkEvidence_ChunkLevel_Success() {
        LinkScenarioEvidenceRequest request = new LinkScenarioEvidenceRequest(
                docId,
                chunkId,
                EvidenceType.POLICY_GUIDELINE,
                "Specific section on conversion quotas",
                new BigDecimal("0.9250")
        );

        DocumentChunkProvenance provenance = new DocumentChunkProvenance(
                chunkId,
                docId,
                2,
                "Section 4.1: Maximum 20% agricultural re-zoning permitted per district annually.",
                14,
                "Section 4.1 Conversion Quotas"
        );

        when(scenarioRepository.findById(scenarioId)).thenReturn(Optional.of(scenario));
        when(researchDocumentRepository.findById(docId)).thenReturn(Optional.of(researchDoc));
        when(researchDocumentService.canRead(eq(researchDoc), any())).thenReturn(true);
        when(documentChunkQueryRepository.findProvenanceById(chunkId)).thenReturn(Optional.of(provenance));
        when(scenarioEvidenceRepository.existsDuplicateEvidence(scenarioId, docId, chunkId, EvidenceType.POLICY_GUIDELINE))
                .thenReturn(false);

        when(scenarioEvidenceRepository.save(any(ScenarioEvidence.class))).thenAnswer(inv -> {
            ScenarioEvidence se = inv.getArgument(0);
            ReflectionTestUtils.setField(se, "id", UUID.randomUUID());
            ReflectionTestUtils.setField(se, "linkedAt", Instant.now());
            return se;
        });

        ScenarioEvidenceResponse response = service.linkEvidence(scenarioId, request, leadUser);

        assertThat(response).isNotNull();
        assertThat(response.documentChunkId()).isEqualTo(chunkId);
        assertThat(response.chunkText()).contains("Maximum 20% agricultural re-zoning");
        assertThat(response.chunkPageNumber()).isEqualTo(14);
        assertThat(response.chunkSectionTitle()).isEqualTo("Section 4.1 Conversion Quotas");
    }

    @Test
    @DisplayName("Reject link when user lacks contribute permissions")
    void linkEvidence_UnauthorizedUser_ThrowsAccessDenied() {
        LinkScenarioEvidenceRequest request = new LinkScenarioEvidenceRequest(
                docId,
                null,
                EvidenceType.POLICY_GUIDELINE,
                "Rationale",
                null
        );

        when(scenarioRepository.findById(scenarioId)).thenReturn(Optional.of(scenario));
        doThrow(new AccessDeniedException("Forbidden")).when(collaborationSecurityService)
                .checkCanContributeToProject(project, leadUser);

        assertThatThrownBy(() -> service.linkEvidence(scenarioId, request, leadUser))
                .isInstanceOf(AccessDeniedException.class);

        verify(scenarioEvidenceRepository, never()).save(any());
    }

    @Test
    @DisplayName("Reject link when scenario is ARCHIVED")
    void linkEvidence_ArchivedScenario_ThrowsIllegalState() {
        scenario.setStatus(ScenarioStatus.ARCHIVED);

        LinkScenarioEvidenceRequest request = new LinkScenarioEvidenceRequest(
                docId,
                null,
                EvidenceType.POLICY_GUIDELINE,
                "Rationale",
                null
        );

        when(scenarioRepository.findById(scenarioId)).thenReturn(Optional.of(scenario));

        assertThatThrownBy(() -> service.linkEvidence(scenarioId, request, leadUser))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot add evidence to an archived scenario");

        verify(scenarioEvidenceRepository, never()).save(any());
    }

    @Test
    @DisplayName("Reject link when research document does not exist")
    void linkEvidence_DocumentNotFound_ThrowsNotFound() {
        LinkScenarioEvidenceRequest request = new LinkScenarioEvidenceRequest(
                docId,
                null,
                EvidenceType.POLICY_GUIDELINE,
                "Rationale",
                null
        );

        when(scenarioRepository.findById(scenarioId)).thenReturn(Optional.of(scenario));
        when(researchDocumentRepository.findById(docId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.linkEvidence(scenarioId, request, leadUser))
                .isInstanceOf(ResearchDocumentNotFoundException.class);
    }

    @Test
    @DisplayName("Reject link when caller cannot read research document (avoid leaking existence)")
    void linkEvidence_UnreadableDocument_ThrowsNotFound() {
        LinkScenarioEvidenceRequest request = new LinkScenarioEvidenceRequest(
                docId,
                null,
                EvidenceType.POLICY_GUIDELINE,
                "Rationale",
                null
        );

        when(scenarioRepository.findById(scenarioId)).thenReturn(Optional.of(scenario));
        when(researchDocumentRepository.findById(docId)).thenReturn(Optional.of(researchDoc));
        when(researchDocumentService.canRead(eq(researchDoc), any())).thenReturn(false);

        assertThatThrownBy(() -> service.linkEvidence(scenarioId, request, leadUser))
                .isInstanceOf(ResearchDocumentNotFoundException.class);
    }

    @Test
    @DisplayName("Reject link when document chunk does not exist")
    void linkEvidence_ChunkNotFound_ThrowsNotFound() {
        LinkScenarioEvidenceRequest request = new LinkScenarioEvidenceRequest(
                docId,
                chunkId,
                EvidenceType.POLICY_GUIDELINE,
                "Rationale",
                null
        );

        when(scenarioRepository.findById(scenarioId)).thenReturn(Optional.of(scenario));
        when(researchDocumentRepository.findById(docId)).thenReturn(Optional.of(researchDoc));
        when(researchDocumentService.canRead(eq(researchDoc), any())).thenReturn(true);
        when(documentChunkQueryRepository.findProvenanceById(chunkId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.linkEvidence(scenarioId, request, leadUser))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Document chunk not found");
    }

    @Test
    @DisplayName("Reject link when chunk belongs to a different research document")
    void linkEvidence_ChunkBelongsToDifferentDoc_ThrowsIllegalArgument() {
        UUID otherDocId = UUID.randomUUID();
        DocumentChunkProvenance mismatch = new DocumentChunkProvenance(
                chunkId,
                otherDocId, // Mismatched doc ID
                1,
                "Some chunk text",
                1,
                "Intro"
        );

        LinkScenarioEvidenceRequest request = new LinkScenarioEvidenceRequest(
                docId,
                chunkId,
                EvidenceType.POLICY_GUIDELINE,
                "Rationale",
                null
        );

        when(scenarioRepository.findById(scenarioId)).thenReturn(Optional.of(scenario));
        when(researchDocumentRepository.findById(docId)).thenReturn(Optional.of(researchDoc));
        when(researchDocumentService.canRead(eq(researchDoc), any())).thenReturn(true);
        when(documentChunkQueryRepository.findProvenanceById(chunkId)).thenReturn(Optional.of(mismatch));

        assertThatThrownBy(() -> service.linkEvidence(scenarioId, request, leadUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not belong to research document");
    }

    @Test
    @DisplayName("Reject link when similarity score is out of bounds")
    void linkEvidence_ScoreOutOfBounds_ThrowsIllegalArgument() {
        LinkScenarioEvidenceRequest request = new LinkScenarioEvidenceRequest(
                docId,
                null,
                EvidenceType.POLICY_GUIDELINE,
                "Rationale",
                new BigDecimal("1.5000") // > 1.0
        );

        when(scenarioRepository.findById(scenarioId)).thenReturn(Optional.of(scenario));
        when(researchDocumentRepository.findById(docId)).thenReturn(Optional.of(researchDoc));
        when(researchDocumentService.canRead(eq(researchDoc), any())).thenReturn(true);

        assertThatThrownBy(() -> service.linkEvidence(scenarioId, request, leadUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Similarity score must be between -1.0000 and 1.0000");
    }

    @Test
    @DisplayName("Reject duplicate evidence link with 409 DuplicateEvidenceException")
    void linkEvidence_Duplicate_ThrowsDuplicateEvidence() {
        LinkScenarioEvidenceRequest request = new LinkScenarioEvidenceRequest(
                docId,
                null,
                EvidenceType.POLICY_GUIDELINE,
                "Rationale",
                null
        );

        when(scenarioRepository.findById(scenarioId)).thenReturn(Optional.of(scenario));
        when(researchDocumentRepository.findById(docId)).thenReturn(Optional.of(researchDoc));
        when(researchDocumentService.canRead(eq(researchDoc), any())).thenReturn(true);
        when(scenarioEvidenceRepository.existsDuplicateEvidence(scenarioId, docId, null, EvidenceType.POLICY_GUIDELINE))
                .thenReturn(true);

        assertThatThrownBy(() -> service.linkEvidence(scenarioId, request, leadUser))
                .isInstanceOf(DuplicateEvidenceException.class)
                .hasMessageContaining("already linked to this scenario");
    }

    @Test
    @DisplayName("Batch retrieves linked evidence and enriches chunk provenance snippets")
    void getScenarioEvidence_Success() {
        UUID evidenceId = UUID.randomUUID();
        ScenarioEvidence se = new ScenarioEvidence(
                scenario,
                researchDoc,
                chunkId,
                EvidenceType.POLICY_GUIDELINE,
                "Quotas rationale",
                new BigDecimal("0.8800"),
                leadUser
        );
        ReflectionTestUtils.setField(se, "id", evidenceId);
        ReflectionTestUtils.setField(se, "linkedAt", Instant.now());

        DocumentChunkProvenance provenance = new DocumentChunkProvenance(
                chunkId,
                docId,
                3,
                "Text snippet of chunk",
                5,
                "Sub-section A"
        );

        when(scenarioRepository.findById(scenarioId)).thenReturn(Optional.of(scenario));
        when(scenarioEvidenceRepository.findByScenarioIdOrderByLinkedAtDesc(scenarioId)).thenReturn(List.of(se));
        when(documentChunkQueryRepository.findProvenanceByIds(Set.of(chunkId)))
                .thenReturn(Map.of(chunkId, provenance));
        when(researchDocumentService.canRead(eq(researchDoc), any())).thenReturn(true);

        List<ScenarioEvidenceResponse> results = service.getScenarioEvidence(scenarioId, leadUser);

        assertThat(results).hasSize(1);
        ScenarioEvidenceResponse resp = results.get(0);
        assertThat(resp.id()).isEqualTo(evidenceId);
        assertThat(resp.documentChunkId()).isEqualTo(chunkId);
        assertThat(resp.chunkText()).isEqualTo("Text snippet of chunk");
        assertThat(resp.chunkPageNumber()).isEqualTo(5);
        assertThat(resp.chunkSectionTitle()).isEqualTo("Sub-section A");
        assertThat(resp.linkedByName()).isEqualTo("Dr. Lead");
    }

    @Test
    @DisplayName("Successfully unlink evidence from scenario")
    void unlinkEvidence_Success() {
        UUID evidenceId = UUID.randomUUID();
        ScenarioEvidence se = new ScenarioEvidence();
        ReflectionTestUtils.setField(se, "id", evidenceId);

        when(scenarioRepository.findById(scenarioId)).thenReturn(Optional.of(scenario));
        when(scenarioEvidenceRepository.findByIdAndScenarioId(evidenceId, scenarioId)).thenReturn(Optional.of(se));

        service.unlinkEvidence(scenarioId, evidenceId, leadUser);

        verify(scenarioEvidenceRepository).delete(se);
    }

    @Test
    @DisplayName("Reject unlink evidence from ARCHIVED scenario")
    void unlinkEvidence_ArchivedScenario_ThrowsIllegalState() {
        scenario.setStatus(ScenarioStatus.ARCHIVED);
        UUID evidenceId = UUID.randomUUID();

        when(scenarioRepository.findById(scenarioId)).thenReturn(Optional.of(scenario));

        assertThatThrownBy(() -> service.unlinkEvidence(scenarioId, evidenceId, leadUser))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot unlink evidence from an archived scenario");

        verify(scenarioEvidenceRepository, never()).delete(any());
    }

    @Test
    @DisplayName("searchEvidenceCandidates delegates to knowledge search without persisting evidence")
    void searchEvidenceCandidates_Success() {
        KnowledgeSearchRequest request = new KnowledgeSearchRequest("rezoning policies", 5, null, null);
        KnowledgeSearchResponse mockResponse = new KnowledgeSearchResponse("rezoning policies", 1, 15, List.of(
                new EvidenceItemResponse(
                        chunkId,
                        docId,
                        "Agricultural Guidelines",
                        "POLICY_DOCUMENT",
                        "Authors",
                        "Org",
                        null,
                        "Chunk text snippet",
                        1,
                        "Intro",
                        0.91,
                        null,
                        "Citation",
                        0
                )
        ));

        when(scenarioRepository.findById(scenarioId)).thenReturn(Optional.of(scenario));
        when(collaborationSecurityService.requireAuthenticatedUser(any())).thenReturn(leadUser);
        when(knowledgeService.search(eq(request), any())).thenReturn(mockResponse);

        KnowledgeSearchResponse response = service.searchEvidenceCandidates(scenarioId, request, null);

        assertThat(response).isNotNull();
        assertThat(response.totalResults()).isEqualTo(1);
        assertThat(response.results().get(0).chunkId()).isEqualTo(chunkId);

        // Verification: NEVER persists any ScenarioEvidence record during search
        verify(scenarioEvidenceRepository, never()).save(any());
    }
}
