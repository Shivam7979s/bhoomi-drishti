package com.bhoomidrishti.governance;

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
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.governance.dto.CreateGovernanceSnapshotRequest;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorEvidenceResponse;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorSnapshotResponse;
import com.bhoomidrishti.governance.dto.LinkGovernanceEvidenceRequest;
import com.bhoomidrishti.governance.entity.AggregationMethod;
import com.bhoomidrishti.governance.entity.GovernanceEvidenceType;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorDefinition;
import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import com.bhoomidrishti.governance.entity.IndicatorCategory;
import com.bhoomidrishti.governance.entity.IndicatorUnit;
import com.bhoomidrishti.governance.entity.SnapshotVisibility;
import com.bhoomidrishti.governance.repository.GovernanceIndicatorDefinitionRepository;
import com.bhoomidrishti.governance.repository.GovernanceIndicatorEvidenceRepository;
import com.bhoomidrishti.governance.repository.GovernanceIndicatorSnapshotRepository;
import com.bhoomidrishti.governance.service.GovernanceIndicatorService;
import com.bhoomidrishti.research.entity.DocumentType;
import com.bhoomidrishti.research.entity.ResearchDocument;
import com.bhoomidrishti.research.entity.ResearchDocumentStatus;
import com.bhoomidrishti.research.repository.ResearchDocumentRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5433/bhoomi_drishti",
        "spring.datasource.username=bhoomi",
        "spring.datasource.password=change_me",
        "spring.flyway.enabled=true"
})
@Transactional
class GovernanceIndicatorIntegrationTest {

    @Autowired
    private GovernanceIndicatorService governanceIndicatorService;

    @Autowired
    private GovernanceIndicatorDefinitionRepository definitionRepository;

    @Autowired
    private GovernanceIndicatorSnapshotRepository snapshotRepository;

    @Autowired
    private GovernanceIndicatorEvidenceRepository evidenceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private ResearchDocumentRepository researchDocumentRepository;

    private User adminUser;
    private User leadUser;
    private User outsiderUser;
    private Project privateProject;
    private Project publicProject;
    private Authentication adminAuth;
    private Authentication leadAuth;
    private Authentication outsiderAuth;
    private ResearchDocument publishedDoc;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        adminUser = User.registerLocal("Admin Officer " + suffix, "admin-" + suffix + "@bhoomi.gov.in", "hashed");
        adminUser.changeRole(Role.ADMIN);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        leadUser = User.registerLocal("Project Lead " + suffix, "lead-" + suffix + "@bhoomi.gov.in", "hashed");
        leadUser.changeRole(Role.RESEARCHER);
        leadUser = userRepository.save(leadUser);
        leadAuth = new UsernamePasswordAuthenticationToken(leadUser, null, List.of(new SimpleGrantedAuthority("ROLE_RESEARCHER")));

        outsiderUser = User.registerLocal("Outsider Researcher " + suffix, "outsider-" + suffix + "@bhoomi.gov.in", "hashed");
        outsiderUser.changeRole(Role.RESEARCHER);
        outsiderUser = userRepository.save(outsiderUser);
        outsiderAuth = new UsernamePasswordAuthenticationToken(outsiderUser, null, List.of(new SimpleGrantedAuthority("ROLE_RESEARCHER")));

        Workspace ws = new Workspace("Workspace " + suffix, "ws-" + suffix, "Description", "Institution", WorkspaceVisibility.PUBLIC, adminUser);
        ws = workspaceRepository.save(ws);
        workspaceMemberRepository.save(new WorkspaceMember(ws, leadUser, WorkspaceRole.MEMBER));

        privateProject = new Project(ws, "Private Project " + suffix, "proj-priv-" + suffix, "Private Proj", ProjectVisibility.PRIVATE_TO_PROJECT_MEMBERS, leadUser);
        privateProject = projectRepository.save(privateProject);
        projectMemberRepository.save(new ProjectMember(privateProject, leadUser, ProjectRole.LEAD));

        publicProject = new Project(ws, "Public Project " + suffix, "proj-pub-" + suffix, "Public Proj", ProjectVisibility.PUBLIC, leadUser);
        publicProject = projectRepository.save(publicProject);

        publishedDoc = new ResearchDocument(
                "Cadastral Reform Circular " + suffix,
                "Description " + suffix,
                DocumentType.GOVERNMENT_REPORT,
                "Govt of MP",
                "Revenue Dept",
                null,
                null,
                null,
                "en",
                null,
                null,
                ResearchDocumentStatus.PUBLISHED,
                adminUser);
        publishedDoc = researchDocumentRepository.save(publishedDoc);
    }

    @Test
    @DisplayName("Verify Flyway V7 seeded definitions exist and unique constraints work")
    void testV7SeededDefinitionsAndConstraints() {
        List<GovernanceIndicatorDefinition> definitions = definitionRepository.findAll();
        assertThat(definitions).isNotEmpty();

        // Verify seeded indicator presence
        assertThat(definitionRepository.findByCode("PARCEL_COUNT_BY_LAND_USE")).isPresent();
        assertThat(definitionRepository.findByCode("DISPUTED_PARCEL_COUNT")).isPresent();
        assertThat(definitionRepository.findByCode("ACTIVE_PARCEL_COUNT")).isPresent();

        // Unique code check constraint
        GovernanceIndicatorDefinition dup = new GovernanceIndicatorDefinition(
                "DISPUTED_PARCEL_COUNT", // duplicate code
                "Another Duplicate",
                "Description",
                IndicatorCategory.STATUS_DISTRIBUTION,
                IndicatorUnit.COUNT,
                AggregationMethod.COUNT,
                "LAND_RECORD",
                "1.0");

        assertThatThrownBy(() -> {
            definitionRepository.saveAndFlush(dup);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Create regional snapshot and verify visibility controls")
    void testCreateRegionalSnapshotAndVisibility() {
        // 1. Published snapshot can be viewed by outsider
        CreateGovernanceSnapshotRequest pubReq = new CreateGovernanceSnapshotRequest(
                "DISPUTED_PARCEL_COUNT",
                null,
                GovernanceScopeType.DISTRICT,
                "Madhya Pradesh",
                "Bhopal",
                null,
                null,
                SnapshotVisibility.PUBLISHED,
                Instant.now(),
                null,
                null,
                "cadastral-v1");

        GovernanceIndicatorSnapshotResponse pubCreated = governanceIndicatorService.createSnapshot(pubReq, adminAuth);
        assertThat(pubCreated.id()).isNotNull();
        assertThat(pubCreated.scopeType()).isEqualTo(GovernanceScopeType.DISTRICT);
        assertThat(pubCreated.numericValue()).isNotNull();
        assertThat(pubCreated.calculationVersion()).isEqualTo("1.0");

        GovernanceIndicatorSnapshotResponse pubRetrieved = governanceIndicatorService.getSnapshotById(pubCreated.id(), outsiderAuth);
        assertThat(pubRetrieved.id()).isEqualTo(pubCreated.id());

        // 2. Internal snapshot cannot be viewed by outsider (404)
        CreateGovernanceSnapshotRequest intReq = new CreateGovernanceSnapshotRequest(
                "DISPUTED_PARCEL_COUNT",
                null,
                GovernanceScopeType.DISTRICT,
                "Madhya Pradesh",
                "Bhopal",
                null,
                null,
                SnapshotVisibility.INTERNAL,
                Instant.now(),
                null,
                null,
                "cadastral-v1");

        GovernanceIndicatorSnapshotResponse intCreated = governanceIndicatorService.createSnapshot(intReq, adminAuth);
        assertThatThrownBy(() -> governanceIndicatorService.getSnapshotById(intCreated.id(), outsiderAuth))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Governance snapshot not found");
    }

    @Test
    @DisplayName("Project snapshot authorization & IDOR prevention")
    void testProjectSnapshotIdorProtection() {
        // Project lead creates snapshot in private project
        CreateGovernanceSnapshotRequest req = new CreateGovernanceSnapshotRequest(
                "ACTIVE_PARCEL_COUNT",
                privateProject.getId(),
                GovernanceScopeType.PROJECT,
                null,
                null,
                null,
                null,
                SnapshotVisibility.INTERNAL,
                Instant.now(),
                null,
                null,
                null);

        GovernanceIndicatorSnapshotResponse created = governanceIndicatorService.createSnapshot(req, leadAuth);
        assertThat(created.projectId()).isEqualTo(privateProject.getId());

        // Lead can view
        GovernanceIndicatorSnapshotResponse leadView = governanceIndicatorService.getSnapshotById(created.id(), leadAuth);
        assertThat(leadView.id()).isEqualTo(created.id());

        // Outsider attempting to view private project snapshot throws 404 (IDOR guard)
        assertThatThrownBy(() -> governanceIndicatorService.getSnapshotById(created.id(), outsiderAuth))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Project not found");

        // Outsider attempting to list snapshots of private project throws 404
        assertThatThrownBy(() -> governanceIndicatorService.getSnapshotsByProject(privateProject.getId(), outsiderAuth))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Project not found");
    }

    @Test
    @DisplayName("Link and unlink evidence on governance snapshot")
    void testLinkAndUnlinkEvidence() {
        CreateGovernanceSnapshotRequest snapReq = new CreateGovernanceSnapshotRequest(
                "DISPUTED_PARCEL_COUNT",
                null,
                GovernanceScopeType.DISTRICT,
                "Madhya Pradesh",
                "Indore",
                null,
                null,
                SnapshotVisibility.PUBLISHED,
                Instant.now(),
                null,
                null,
                null);

        GovernanceIndicatorSnapshotResponse snap = governanceIndicatorService.createSnapshot(snapReq, adminAuth);

        LinkGovernanceEvidenceRequest linkReq = new LinkGovernanceEvidenceRequest(
                publishedDoc.getId(),
                null,
                GovernanceEvidenceType.ADMINISTRATIVE_CIRCULAR,
                "Official administrative circular establishing dispute resolution norms",
                new BigDecimal("0.8900"));

        GovernanceIndicatorEvidenceResponse linked = governanceIndicatorService.linkEvidence(snap.id(), linkReq, adminAuth);
        assertThat(linked.id()).isNotNull();
        assertThat(linked.snapshotId()).isEqualTo(snap.id());
        assertThat(linked.documentTitle()).isEqualTo(publishedDoc.getTitle());

        // Duplicate link throws DuplicateEvidenceException
        assertThatThrownBy(() -> governanceIndicatorService.linkEvidence(snap.id(), linkReq, adminAuth))
                .isInstanceOf(DuplicateEvidenceException.class);

        // Retrieve snapshot evidence list
        List<GovernanceIndicatorEvidenceResponse> evidenceList = governanceIndicatorService.getSnapshotEvidence(snap.id(), outsiderAuth);
        assertThat(evidenceList).hasSize(1);
        assertThat(evidenceList.get(0).id()).isEqualTo(linked.id());

        // Unlink evidence
        governanceIndicatorService.unlinkEvidence(snap.id(), linked.id(), adminAuth);

        List<GovernanceIndicatorEvidenceResponse> emptyList = governanceIndicatorService.getSnapshotEvidence(snap.id(), outsiderAuth);
        assertThat(emptyList).isEmpty();
    }

    @Test
    @DisplayName("Evidence constraint: rejecting row with neither doc nor chunk")
    void testEvidenceMissingBothDocAndChunk() {
        CreateGovernanceSnapshotRequest snapReq = new CreateGovernanceSnapshotRequest(
                "DISPUTED_PARCEL_COUNT",
                null,
                GovernanceScopeType.DISTRICT,
                "Madhya Pradesh",
                "Indore",
                null,
                null,
                SnapshotVisibility.PUBLISHED,
                Instant.now(),
                null,
                null,
                null);
        GovernanceIndicatorSnapshotResponse snap = governanceIndicatorService.createSnapshot(snapReq, adminAuth);

        LinkGovernanceEvidenceRequest invalidReq = new LinkGovernanceEvidenceRequest(
                null,
                null,
                GovernanceEvidenceType.ADMINISTRATIVE_CIRCULAR,
                "Rationale without targets",
                null);

        assertThatThrownBy(() -> governanceIndicatorService.linkEvidence(snap.id(), invalidReq, adminAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("At least one of researchDocumentId or documentChunkId must be provided");
    }

    @Test
    @DisplayName("Query foundation: scope hierarchy filtering, indicator code filter, and visibility checks")
    void testQuerySnapshotsByScopeHierarchy() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String testDistrict = "Dist-" + suffix;

        // Create 1 PUBLISHED snapshot
        CreateGovernanceSnapshotRequest pubReq = new CreateGovernanceSnapshotRequest(
                "DISPUTED_PARCEL_COUNT",
                null,
                GovernanceScopeType.DISTRICT,
                "Madhya Pradesh",
                testDistrict,
                null,
                null,
                SnapshotVisibility.PUBLISHED,
                Instant.now(),
                null,
                null,
                null);
        governanceIndicatorService.createSnapshot(pubReq, adminAuth);

        // Create 1 INTERNAL snapshot for the same district
        CreateGovernanceSnapshotRequest intReq = new CreateGovernanceSnapshotRequest(
                "ACTIVE_PARCEL_COUNT",
                null,
                GovernanceScopeType.DISTRICT,
                "Madhya Pradesh",
                testDistrict,
                null,
                null,
                SnapshotVisibility.INTERNAL,
                Instant.now(),
                null,
                null,
                null);
        governanceIndicatorService.createSnapshot(intReq, adminAuth);

        // Outsider: only sees 1 (the PUBLISHED one)
        List<GovernanceIndicatorSnapshotResponse> outsiderResults = governanceIndicatorService.getSnapshotsByScope(
                GovernanceScopeType.DISTRICT, "Madhya Pradesh", testDistrict, null, null, null, outsiderAuth);
        assertThat(outsiderResults).hasSize(1);
        assertThat(outsiderResults.get(0).visibility()).isEqualTo(SnapshotVisibility.PUBLISHED);

        // Admin: sees both (2)
        List<GovernanceIndicatorSnapshotResponse> adminResults = governanceIndicatorService.getSnapshotsByScope(
                GovernanceScopeType.DISTRICT, "Madhya Pradesh", testDistrict, null, null, null, adminAuth);
        assertThat(adminResults).hasSize(2);

        // Indicator code filter: only DISPUTED_PARCEL_COUNT
        List<GovernanceIndicatorSnapshotResponse> filteredResults = governanceIndicatorService.getSnapshotsByScope(
                GovernanceScopeType.DISTRICT, "Madhya Pradesh", testDistrict, null, null, "DISPUTED_PARCEL_COUNT", adminAuth);
        assertThat(filteredResults).hasSize(1);
        assertThat(filteredResults.get(0).indicatorCode()).isEqualTo("DISPUTED_PARCEL_COUNT");

        // Invalid scope hierarchy: missing district for DISTRICT scope must fail with IllegalArgumentException
        assertThatThrownBy(() -> governanceIndicatorService.getSnapshotsByScope(
                GovernanceScopeType.DISTRICT, "Madhya Pradesh", null, null, null, null, adminAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("state and district are required for DISTRICT scope type");
    }

    @Test
    @DisplayName("Query foundation: project snapshot query isolation and IDOR protection")
    void testQuerySnapshotsByProjectIsolation() {
        CreateGovernanceSnapshotRequest projReq = new CreateGovernanceSnapshotRequest(
                "ACTIVE_PARCEL_COUNT",
                privateProject.getId(),
                GovernanceScopeType.PROJECT,
                null,
                null,
                null,
                null,
                SnapshotVisibility.INTERNAL,
                Instant.now(),
                null,
                null,
                null);
        governanceIndicatorService.createSnapshot(projReq, leadAuth);

        // Project lead can retrieve project snapshots
        List<GovernanceIndicatorSnapshotResponse> leadResults =
                governanceIndicatorService.getSnapshotsByProject(privateProject.getId(), leadAuth);
        assertThat(leadResults).hasSize(1);
        assertThat(leadResults.get(0).projectId()).isEqualTo(privateProject.getId());

        // Outsider querying private project snapshots receives 404 (IDOR safe)
        assertThatThrownBy(() -> governanceIndicatorService.getSnapshotsByProject(privateProject.getId(), outsiderAuth))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Project not found");
    }
}
