package com.bhoomidrishti.policy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.ProjectMember;
import com.bhoomidrishti.collaboration.entity.ProjectRole;
import com.bhoomidrishti.collaboration.entity.ProjectVisibility;
import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceMember;
import com.bhoomidrishti.collaboration.entity.WorkspaceRole;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import com.bhoomidrishti.collaboration.repository.ProjectMemberRepository;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.collaboration.repository.WorkspaceMemberRepository;
import com.bhoomidrishti.collaboration.repository.WorkspaceRepository;
import com.bhoomidrishti.exception.DuplicateEvidenceException;
import com.bhoomidrishti.exception.ResearchDocumentNotFoundException;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.policy.dto.LinkScenarioEvidenceRequest;
import com.bhoomidrishti.policy.dto.ScenarioEvidenceResponse;
import com.bhoomidrishti.policy.entity.EvidenceType;
import com.bhoomidrishti.policy.entity.PolicyScenario;
import com.bhoomidrishti.policy.entity.ScenarioEvidence;
import com.bhoomidrishti.policy.entity.ScenarioStatus;
import com.bhoomidrishti.policy.entity.ScenarioType;
import com.bhoomidrishti.policy.repository.DocumentChunkQueryRepository;
import com.bhoomidrishti.policy.repository.PolicyScenarioRepository;
import com.bhoomidrishti.policy.repository.ScenarioEvidenceRepository;
import com.bhoomidrishti.policy.service.ScenarioEvidenceService;
import com.bhoomidrishti.research.entity.DocumentType;
import com.bhoomidrishti.research.entity.ResearchDocument;
import com.bhoomidrishti.research.entity.ResearchDocumentStatus;
import com.bhoomidrishti.research.repository.ResearchDocumentRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

/**
 * Real PostgreSQL + PostGIS integration tests for Phase 8C:
 * Evidence & Provenance Linking for Policy Scenarios.
 */
@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5433/bhoomi_drishti",
        "spring.datasource.username=bhoomi",
        "spring.datasource.password=change_me",
        "spring.flyway.enabled=true",
        "spring.jpa.hibernate.ddl-auto=none"
})
@Transactional
class ScenarioEvidenceIntegrationTest {

    @Autowired
    private ScenarioEvidenceService evidenceService;

    @Autowired
    private PolicyScenarioRepository scenarioRepository;

    @Autowired
    private ScenarioEvidenceRepository scenarioEvidenceRepository;

    @Autowired
    private ResearchDocumentRepository researchDocumentRepository;

    @Autowired
    private DocumentChunkQueryRepository documentChunkQueryRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User projectLead;
    private User externalUser;
    private Project project;
    private PolicyScenario scenario;
    private ResearchDocument publishedDoc;
    private UUID chunkId;

    @BeforeEach
    void setUp() {
        projectLead = userRepository.saveAndFlush(User.registerLocal(
                "Lead Researcher",
                "lead-" + UUID.randomUUID() + "@example.com",
                "hash"
        ));
        projectLead.changeRole(Role.RESEARCHER);
        projectLead = userRepository.saveAndFlush(projectLead);

        externalUser = userRepository.saveAndFlush(User.registerLocal(
                "External Researcher",
                "external-" + UUID.randomUUID() + "@example.com",
                "hash"
        ));
        externalUser.changeRole(Role.RESEARCHER);
        externalUser = userRepository.saveAndFlush(externalUser);

        Workspace ws = workspaceRepository.saveAndFlush(new Workspace(
                "Policy WS",
                "policy-ws-" + UUID.randomUUID().toString().substring(0, 8),
                "Workspace for policy analysis",
                "MoHUA",
                WorkspaceVisibility.PUBLIC,
                projectLead
        ));
        workspaceMemberRepository.saveAndFlush(new WorkspaceMember(ws, projectLead, WorkspaceRole.OWNER));

        project = projectRepository.saveAndFlush(new Project(
                ws,
                "Urban Corridor Project",
                "corridor-proj-" + UUID.randomUUID().toString().substring(0, 8),
                "Urban corridor expansion scenario analysis",
                ProjectVisibility.WORKSPACE_INHERITED,
                projectLead
        ));
        projectMemberRepository.saveAndFlush(new ProjectMember(project, projectLead, ProjectRole.LEAD));

        scenario = scenarioRepository.saveAndFlush(new PolicyScenario(
                project,
                projectLead,
                "Buffer Zone Assessment",
                "buffer-zone-assessment",
                "Evaluating buffer zones along proposed highway corridor",
                ScenarioType.CORRIDOR_BUFFER_INTERVENTION
        ));

        // Create published research document
        publishedDoc = new ResearchDocument(
                "National Highway Corridor Land Acquisition Guidelines",
                "Official statutory guidelines for road corridor buffer zones",
                DocumentType.POLICY_DOCUMENT,
                "Ministry of Road Transport and Highways",
                "MoRTH",
                LocalDate.of(2023, 5, 1),
                null,
                null,
                "en",
                "highway,corridor,acquisition",
                "Official acquisition norms",
                ResearchDocumentStatus.PUBLISHED,
                projectLead
        );
        publishedDoc = researchDocumentRepository.saveAndFlush(publishedDoc);

        // Insert a document chunk directly into document_chunks table with zero embedding vector
        chunkId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO document_chunks (" +
                "  id, research_document_id, chunk_index, text, page_number, section_title, token_count, embedding, created_at" +
                ") VALUES (" +
                "  ?, ?, ?, ?, ?, ?, ?, ('[' || array_to_string(array_fill(0.0::real, ARRAY[384]), ',') || ']')::vector, NOW()" +
                ")",
                chunkId,
                publishedDoc.getId(),
                1,
                "Section 12.3: Highway buffer corridors require a mandatory 100-meter minimum buffer from center line.",
                28,
                "Section 12.3 Corridor Buffers",
                18
        );
    }

    @Test
    @DisplayName("Successfully link document-level evidence and persist in PostgreSQL")
    void linkEvidence_DocumentLevel_Success() {
        LinkScenarioEvidenceRequest request = new LinkScenarioEvidenceRequest(
                publishedDoc.getId(),
                null,
                EvidenceType.STATUTORY_AUTHORITY,
                "Official statutory authority for buffer dimensions",
                new BigDecimal("0.8920")
        );

        ScenarioEvidenceResponse response = evidenceService.linkEvidence(scenario.getId(), request, projectLead);

        assertThat(response).isNotNull();
        assertThat(response.id()).isNotNull();
        assertThat(response.scenarioId()).isEqualTo(scenario.getId());
        assertThat(response.researchDocumentId()).isEqualTo(publishedDoc.getId());
        assertThat(response.documentTitle()).isEqualTo("National Highway Corridor Land Acquisition Guidelines");
        assertThat(response.documentChunkId()).isNull();
        assertThat(response.chunkText()).isNull();
        assertThat(response.evidenceType()).isEqualTo(EvidenceType.STATUTORY_AUTHORITY);
        assertThat(response.similarityScore()).isEqualByComparingTo("0.8920");

        // Verify persisted in DB
        ScenarioEvidence persisted = scenarioEvidenceRepository.findById(response.id()).orElseThrow();
        assertThat(persisted.getScenario().getId()).isEqualTo(scenario.getId());
        assertThat(persisted.getResearchDocument().getId()).isEqualTo(publishedDoc.getId());
        assertThat(persisted.getDocumentChunkId()).isNull();
    }

    @Test
    @DisplayName("Successfully link chunk-level evidence with verified provenance snippets")
    void linkEvidence_ChunkLevel_Success() {
        LinkScenarioEvidenceRequest request = new LinkScenarioEvidenceRequest(
                publishedDoc.getId(),
                chunkId,
                EvidenceType.POLICY_GUIDELINE,
                "Mandatory 100m buffer requirement",
                new BigDecimal("0.9540")
        );

        ScenarioEvidenceResponse response = evidenceService.linkEvidence(scenario.getId(), request, projectLead);

        assertThat(response).isNotNull();
        assertThat(response.documentChunkId()).isEqualTo(chunkId);
        assertThat(response.chunkText()).contains("mandatory 100-meter minimum buffer");
        assertThat(response.chunkPageNumber()).isEqualTo(28);
        assertThat(response.chunkSectionTitle()).isEqualTo("Section 12.3 Corridor Buffers");

        // Retrieve all evidence and verify batch resolution
        List<ScenarioEvidenceResponse> allEvidence = evidenceService.getScenarioEvidence(scenario.getId(), projectLead);
        assertThat(allEvidence).hasSize(1);
        assertThat(allEvidence.get(0).documentChunkId()).isEqualTo(chunkId);
        assertThat(allEvidence.get(0).chunkText()).contains("mandatory 100-meter minimum buffer");
    }

    @Test
    @DisplayName("Reject duplicate evidence link with DuplicateEvidenceException (409)")
    void linkEvidence_Duplicate_ThrowsDuplicateEvidenceException() {
        LinkScenarioEvidenceRequest request = new LinkScenarioEvidenceRequest(
                publishedDoc.getId(),
                chunkId,
                EvidenceType.POLICY_GUIDELINE,
                "Initial link",
                new BigDecimal("0.9000")
        );

        evidenceService.linkEvidence(scenario.getId(), request, projectLead);

        // Attempt exact duplicate
        assertThatThrownBy(() -> evidenceService.linkEvidence(scenario.getId(), request, projectLead))
                .isInstanceOf(DuplicateEvidenceException.class)
                .hasMessageContaining("already linked to this scenario");
    }

    @Test
    @DisplayName("Reject link when document chunk belongs to a different research document")
    void linkEvidence_ChunkBelongsToDifferentDoc_ThrowsIllegalArgument() {
        // Create another research document
        ResearchDocument otherDoc = new ResearchDocument(
                "Water Body Preservation Norms",
                "Rules for water bodies",
                DocumentType.POLICY_DOCUMENT,
                "MoEFCC",
                "Gov",
                LocalDate.of(2023, 2, 1),
                null,
                null,
                "en",
                "water,preservation",
                "Water bodies preservation",
                ResearchDocumentStatus.PUBLISHED,
                projectLead
        );
        otherDoc = researchDocumentRepository.saveAndFlush(otherDoc);

        // Try linking chunkId (which belongs to publishedDoc) to otherDoc
        LinkScenarioEvidenceRequest request = new LinkScenarioEvidenceRequest(
                otherDoc.getId(),
                chunkId,
                EvidenceType.POLICY_GUIDELINE,
                "Cross-document mismatch",
                null
        );

        assertThatThrownBy(() -> evidenceService.linkEvidence(scenario.getId(), request, projectLead))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not belong to research document");
    }

    @Test
    @DisplayName("Reject link when user lacks project contributor or lead permissions")
    void linkEvidence_NonMember_ThrowsAccessDenied() {
        LinkScenarioEvidenceRequest request = new LinkScenarioEvidenceRequest(
                publishedDoc.getId(),
                null,
                EvidenceType.POLICY_GUIDELINE,
                "Unauthorized attempt",
                null
        );

        assertThatThrownBy(() -> evidenceService.linkEvidence(scenario.getId(), request, externalUser))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Successfully unlink evidence and verify deletion from database")
    void unlinkEvidence_Success() {
        LinkScenarioEvidenceRequest request = new LinkScenarioEvidenceRequest(
                publishedDoc.getId(),
                null,
                EvidenceType.POLICY_GUIDELINE,
                "Link to delete",
                null
        );

        ScenarioEvidenceResponse response = evidenceService.linkEvidence(scenario.getId(), request, projectLead);
        assertThat(scenarioEvidenceRepository.existsById(response.id())).isTrue();

        evidenceService.unlinkEvidence(scenario.getId(), response.id(), projectLead);

        assertThat(scenarioEvidenceRepository.existsById(response.id())).isFalse();
    }

    @Test
    @DisplayName("Reject unlinking non-existent evidence with ResourceNotFoundException")
    void unlinkEvidence_NotFound_ThrowsNotFound() {
        UUID nonExistentId = UUID.randomUUID();

        assertThatThrownBy(() -> evidenceService.unlinkEvidence(scenario.getId(), nonExistentId, projectLead))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Scenario evidence not found");
    }

    @Test
    @DisplayName("Reject linking evidence to ARCHIVED scenario")
    void linkEvidence_ArchivedScenario_ThrowsIllegalState() {
        scenario.setStatus(ScenarioStatus.ARCHIVED);
        scenarioRepository.save(scenario);

        LinkScenarioEvidenceRequest request = new LinkScenarioEvidenceRequest(
                publishedDoc.getId(),
                null,
                EvidenceType.POLICY_GUIDELINE,
                "Attempt on archived scenario",
                null
        );

        assertThatThrownBy(() -> evidenceService.linkEvidence(scenario.getId(), request, projectLead))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot add evidence to an archived scenario");
    }
}
