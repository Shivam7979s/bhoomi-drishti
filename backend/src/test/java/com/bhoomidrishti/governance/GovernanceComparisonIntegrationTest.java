package com.bhoomidrishti.governance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.auth.security.JwtService;
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
import com.bhoomidrishti.governance.entity.GovernanceEvidenceType;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorDefinition;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorEvidence;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorSnapshot;
import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import com.bhoomidrishti.governance.entity.SnapshotVisibility;
import com.bhoomidrishti.governance.repository.GovernanceIndicatorDefinitionRepository;
import com.bhoomidrishti.governance.repository.GovernanceIndicatorEvidenceRepository;
import com.bhoomidrishti.governance.repository.GovernanceIndicatorSnapshotRepository;
import com.bhoomidrishti.research.entity.DocumentType;
import com.bhoomidrishti.research.entity.ResearchDocument;
import com.bhoomidrishti.research.entity.ResearchDocumentStatus;
import com.bhoomidrishti.research.repository.ResearchDocumentRepository;
import jakarta.servlet.http.Cookie;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * End-to-end integration tests for Phase 9B.5.2:
 * Temporal Governance Audit Comparison REST API and Security Integration.
 *
 * <p>Validates:
 * <ul>
 *   <li>HTTP endpoint POST /api/governance/compare routing and response schema.</li>
 *   <li>Public published snapshot comparisons without credentials.</li>
 *   <li>Snapshot-vs-Live real-time cadastral comparison without persistence.</li>
 *   <li>Role-based access control and anti-IDOR 404 concealment for internal snapshots.</li>
 *   <li>Project collaboration boundaries and anti-IDOR 404 concealment for private projects.</li>
 *   <li>Cross-project security: authorization evaluation before semantic compatibility checks.</li>
 *   <li>Strict semantic scope compatibility (mismatched indicator, scope type, district, project).</li>
 *   <li>Deterministic neutral metrics ("NOT_DEFINED" trend) and evidence provenance diffs.</li>
 *   <li>Zero database mutation guarantee across comparison invocations.</li>
 *   <li>Security regression: permitAll() in filter chain does not bypass service-level access checks.</li>
 * </ul>
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5433/bhoomi_drishti",
        "spring.datasource.username=bhoomi",
        "spring.datasource.password=change_me",
        "spring.flyway.enabled=true"
})
@Transactional
class GovernanceComparisonIntegrationTest {

    private static final String SESSION_COOKIE = "bhoomi_auth";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private GovernanceIndicatorDefinitionRepository definitionRepository;

    @Autowired
    private GovernanceIndicatorSnapshotRepository snapshotRepository;

    @Autowired
    private GovernanceIndicatorEvidenceRepository evidenceRepository;

    @Autowired
    private ResearchDocumentRepository researchDocumentRepository;

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

    private User adminUser;
    private User officialUser;
    private User researcherUser;
    private User outsiderUser;

    private Project privateProjectA;
    private Project privateProjectB;

    private GovernanceIndicatorDefinition activeParcelDef;
    private GovernanceIndicatorDefinition disputedParcelDef;

    private String testSuffix;
    private String testState;
    private String testDistrictBhopal;
    private String testDistrictIndore;

    @BeforeEach
    void setUp() {
        testSuffix = UUID.randomUUID().toString().substring(0, 8);
        testState = "Madhya Pradesh";
        testDistrictBhopal = "Bhopal-" + testSuffix;
        testDistrictIndore = "Indore-" + testSuffix;

        adminUser = User.registerLocal("Admin User " + testSuffix, "admin-" + testSuffix + "@bhoomi.gov.in", "hash");
        adminUser.changeRole(Role.ADMIN);
        adminUser = userRepository.save(adminUser);

        officialUser = User.registerLocal("Official User " + testSuffix, "official-" + testSuffix + "@bhoomi.gov.in", "hash");
        officialUser.changeRole(Role.GOVERNMENT_OFFICIAL);
        officialUser = userRepository.save(officialUser);

        researcherUser = User.registerLocal("Researcher User " + testSuffix, "researcher-" + testSuffix + "@bhoomi.gov.in", "hash");
        researcherUser.changeRole(Role.RESEARCHER);
        researcherUser = userRepository.save(researcherUser);

        outsiderUser = User.registerLocal("Outsider User " + testSuffix, "outsider-" + testSuffix + "@bhoomi.gov.in", "hash");
        outsiderUser.changeRole(Role.RESEARCHER);
        outsiderUser = userRepository.save(outsiderUser);

        Workspace ws = new Workspace("Workspace " + testSuffix, "ws-" + testSuffix, "Desc", "Inst", WorkspaceVisibility.PRIVATE, adminUser);
        ws = workspaceRepository.save(ws);
        workspaceMemberRepository.save(new WorkspaceMember(ws, researcherUser, WorkspaceRole.MEMBER));

        privateProjectA = new Project(ws, "Project A " + testSuffix, "proj-a-" + testSuffix, "Desc A", ProjectVisibility.PRIVATE_TO_PROJECT_MEMBERS, adminUser);
        privateProjectA = projectRepository.save(privateProjectA);
        projectMemberRepository.save(new ProjectMember(privateProjectA, researcherUser, ProjectRole.LEAD));

        privateProjectB = new Project(ws, "Project B " + testSuffix, "proj-b-" + testSuffix, "Desc B", ProjectVisibility.PRIVATE_TO_PROJECT_MEMBERS, adminUser);
        privateProjectB = projectRepository.save(privateProjectB);

        activeParcelDef = definitionRepository.findByCode("ACTIVE_PARCEL_COUNT")
                .orElseThrow(() -> new IllegalStateException("ACTIVE_PARCEL_COUNT definition missing"));
        disputedParcelDef = definitionRepository.findByCode("DISPUTED_PARCEL_COUNT")
                .orElseThrow(() -> new IllegalStateException("DISPUTED_PARCEL_COUNT definition missing"));
    }

    private Cookie authCookie(User user) {
        return new Cookie(SESSION_COOKIE, jwtService.generateToken(user));
    }

    private GovernanceIndicatorSnapshot createRegionalSnapshot(
            GovernanceIndicatorDefinition def,
            GovernanceScopeType scopeType,
            String state,
            String district,
            SnapshotVisibility visibility,
            Instant asOf,
            BigDecimal numericValue,
            BigDecimal denominator,
            String breakdownJson,
            String calculationVersion) {

        GovernanceIndicatorSnapshot snapshot = new GovernanceIndicatorSnapshot(
                def,
                null,
                scopeType,
                state,
                district,
                null,
                null,
                visibility,
                asOf,
                null,
                null,
                numericValue,
                denominator,
                breakdownJson,
                calculationVersion,
                asOf,
                "v1",
                adminUser
        );
        return snapshotRepository.save(snapshot);
    }

    private GovernanceIndicatorSnapshot createProjectSnapshot(
            GovernanceIndicatorDefinition def,
            Project project,
            Instant asOf,
            BigDecimal numericValue,
            BigDecimal denominator,
            String breakdownJson,
            String calculationVersion) {

        GovernanceIndicatorSnapshot snapshot = new GovernanceIndicatorSnapshot(
                def,
                project,
                GovernanceScopeType.PROJECT,
                null,
                null,
                null,
                null,
                SnapshotVisibility.INTERNAL,
                asOf,
                null,
                null,
                numericValue,
                denominator,
                breakdownJson,
                calculationVersion,
                asOf,
                "v1",
                adminUser
        );
        return snapshotRepository.save(snapshot);
    }

    // =========================================================================
    // 16.A: Published Regional Snapshot -> Published Regional Snapshot (Anonymous)
    // =========================================================================

    @Test
    @DisplayName("A. Published regional snapshot vs published regional snapshot (Anonymous -> 200 OK)")
    void testPublishedRegionalSnapshotVsPublished_Anonymous_200() throws Exception {
        GovernanceIndicatorSnapshot snap1 = createRegionalSnapshot(
                activeParcelDef, GovernanceScopeType.DISTRICT, testState, testDistrictBhopal,
                SnapshotVisibility.PUBLISHED, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("100.0000"), new BigDecimal("1000.0000"),
                "{\"active\": 100}", "1.0");

        GovernanceIndicatorSnapshot snap2 = createRegionalSnapshot(
                activeParcelDef, GovernanceScopeType.DISTRICT, testState, testDistrictBhopal,
                SnapshotVisibility.PUBLISHED, Instant.parse("2026-06-01T00:00:00Z"),
                new BigDecimal("150.0000"), new BigDecimal("1000.0000"),
                "{\"active\": 150}", "1.0");

        String payload = """
                {
                    "baselineSnapshotId": "%s",
                    "targetSnapshotId": "%s",
                    "compareToLive": false
                }
                """.formatted(snap1.getId(), snap2.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.indicatorCode").value("ACTIVE_PARCEL_COUNT"))
                .andExpect(jsonPath("$.scopeType").value("DISTRICT"))
                .andExpect(jsonPath("$.state").value(testState))
                .andExpect(jsonPath("$.district").value(testDistrictBhopal))
                .andExpect(jsonPath("$.baseline.snapshotId").value(snap1.getId().toString()))
                .andExpect(jsonPath("$.baseline.isLive").value(false))
                .andExpect(jsonPath("$.target.snapshotId").value(snap2.getId().toString()))
                .andExpect(jsonPath("$.target.isLive").value(false))
                .andExpect(jsonPath("$.quantitativeVariance.absoluteDelta").value(50.0))
                .andExpect(jsonPath("$.quantitativeVariance.percentageChange").value(50.0))
                .andExpect(jsonPath("$.quantitativeVariance.trendDirection").value("NOT_DEFINED"))
                .andExpect(jsonPath("$.elapsedDays").value(151))
                .andExpect(jsonPath("$.chronologicalReversal").value(false));
    }

    // =========================================================================
    // 16.B: Published Regional Snapshot -> LIVE (Anonymous)
    // =========================================================================

    @Test
    @DisplayName("B. Published regional snapshot vs LIVE (Anonymous -> 200 OK)")
    void testPublishedRegionalSnapshotVsLive_Anonymous_200() throws Exception {
        GovernanceIndicatorSnapshot snap1 = createRegionalSnapshot(
                activeParcelDef, GovernanceScopeType.DISTRICT, testState, testDistrictBhopal,
                SnapshotVisibility.PUBLISHED, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("100.0000"), new BigDecimal("1000.0000"),
                "{\"active\": 100}", "1.0");

        String payload = """
                {
                    "baselineSnapshotId": "%s",
                    "compareToLive": true
                }
                """.formatted(snap1.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.indicatorCode").value("ACTIVE_PARCEL_COUNT"))
                .andExpect(jsonPath("$.baseline.snapshotId").value(snap1.getId().toString()))
                .andExpect(jsonPath("$.baseline.isLive").value(false))
                .andExpect(jsonPath("$.target.snapshotId").isEmpty())
                .andExpect(jsonPath("$.target.isLive").value(true))
                .andExpect(jsonPath("$.quantitativeVariance").isNotEmpty())
                .andExpect(jsonPath("$.quantitativeVariance.trendDirection").value("NOT_DEFINED"));
    }

    // =========================================================================
    // 16.C: Internal Regional Snapshot -> Authorized Official
    // =========================================================================

    @Test
    @DisplayName("C. Internal regional snapshot vs target (Authorized Official -> 200 OK)")
    void testInternalRegionalSnapshot_AuthorizedOfficial_200() throws Exception {
        GovernanceIndicatorSnapshot snap1 = createRegionalSnapshot(
                activeParcelDef, GovernanceScopeType.DISTRICT, testState, testDistrictBhopal,
                SnapshotVisibility.INTERNAL, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("100.0000"), new BigDecimal("1000.0000"),
                "{\"active\": 100}", "1.0");

        GovernanceIndicatorSnapshot snap2 = createRegionalSnapshot(
                activeParcelDef, GovernanceScopeType.DISTRICT, testState, testDistrictBhopal,
                SnapshotVisibility.INTERNAL, Instant.parse("2026-06-01T00:00:00Z"),
                new BigDecimal("120.0000"), new BigDecimal("1000.0000"),
                "{\"active\": 120}", "1.0");

        String payload = """
                {
                    "baselineSnapshotId": "%s",
                    "targetSnapshotId": "%s",
                    "compareToLive": false
                }
                """.formatted(snap1.getId(), snap2.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .cookie(authCookie(officialUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.baseline.snapshotId").value(snap1.getId().toString()))
                .andExpect(jsonPath("$.target.snapshotId").value(snap2.getId().toString()));
    }

    // =========================================================================
    // 16.D: Internal Regional Snapshot -> Unauthorized User (404 anti-IDOR)
    // =========================================================================

    @Test
    @DisplayName("D. Internal regional snapshot vs target (Unauthorized Researcher -> 404 Not Found)")
    void testInternalRegionalSnapshot_UnauthorizedUser_404() throws Exception {
        GovernanceIndicatorSnapshot snap1 = createRegionalSnapshot(
                activeParcelDef, GovernanceScopeType.DISTRICT, testState, testDistrictBhopal,
                SnapshotVisibility.INTERNAL, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("100.0000"), new BigDecimal("1000.0000"),
                "{\"active\": 100}", "1.0");

        GovernanceIndicatorSnapshot snap2 = createRegionalSnapshot(
                activeParcelDef, GovernanceScopeType.DISTRICT, testState, testDistrictBhopal,
                SnapshotVisibility.PUBLISHED, Instant.parse("2026-06-01T00:00:00Z"),
                new BigDecimal("120.0000"), new BigDecimal("1000.0000"),
                "{\"active\": 120}", "1.0");

        String payload = """
                {
                    "baselineSnapshotId": "%s",
                    "targetSnapshotId": "%s",
                    "compareToLive": false
                }
                """.formatted(snap1.getId(), snap2.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .cookie(authCookie(researcherUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    // =========================================================================
    // 16.E: Internal Regional Snapshot -> Anonymous (404 anti-IDOR)
    // =========================================================================

    @Test
    @DisplayName("E. Internal regional snapshot vs target (Anonymous -> 404 Not Found)")
    void testInternalRegionalSnapshot_Anonymous_404() throws Exception {
        GovernanceIndicatorSnapshot snap1 = createRegionalSnapshot(
                activeParcelDef, GovernanceScopeType.DISTRICT, testState, testDistrictBhopal,
                SnapshotVisibility.INTERNAL, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("100.0000"), new BigDecimal("1000.0000"),
                "{\"active\": 100}", "1.0");

        String payload = """
                {
                    "baselineSnapshotId": "%s",
                    "compareToLive": true
                }
                """.formatted(snap1.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    // =========================================================================
    // 16.F: Authorized Project Snapshot Comparison
    // =========================================================================

    @Test
    @DisplayName("F. Authorized project snapshot comparison (Project Member -> 200 OK)")
    void testAuthorizedProjectSnapshotComparison_200() throws Exception {
        GovernanceIndicatorSnapshot snap1 = createProjectSnapshot(
                activeParcelDef, privateProjectA, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("50.0000"), new BigDecimal("200.0000"),
                "{\"active\": 50}", "1.0");

        GovernanceIndicatorSnapshot snap2 = createProjectSnapshot(
                activeParcelDef, privateProjectA, Instant.parse("2026-03-01T00:00:00Z"),
                new BigDecimal("75.0000"), new BigDecimal("200.0000"),
                "{\"active\": 75}", "1.0");

        String payload = """
                {
                    "baselineSnapshotId": "%s",
                    "targetSnapshotId": "%s",
                    "compareToLive": false
                }
                """.formatted(snap1.getId(), snap2.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .cookie(authCookie(researcherUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scopeType").value("PROJECT"))
                .andExpect(jsonPath("$.projectId").value(privateProjectA.getId().toString()))
                .andExpect(jsonPath("$.quantitativeVariance.absoluteDelta").value(25.0));
    }

    // =========================================================================
    // 16.G: Unauthorized Private Project (Non-member -> 404 anti-IDOR)
    // =========================================================================

    @Test
    @DisplayName("G. Unauthorized private project snapshot (Non-member -> 404 Not Found)")
    void testUnauthorizedPrivateProject_404() throws Exception {
        GovernanceIndicatorSnapshot snap1 = createProjectSnapshot(
                activeParcelDef, privateProjectA, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("50.0000"), new BigDecimal("200.0000"),
                "{\"active\": 50}", "1.0");

        GovernanceIndicatorSnapshot snap2 = createProjectSnapshot(
                activeParcelDef, privateProjectA, Instant.parse("2026-03-01T00:00:00Z"),
                new BigDecimal("75.0000"), new BigDecimal("200.0000"),
                "{\"active\": 75}", "1.0");

        String payload = """
                {
                    "baselineSnapshotId": "%s",
                    "targetSnapshotId": "%s",
                    "compareToLive": false
                }
                """.formatted(snap1.getId(), snap2.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .cookie(authCookie(outsiderUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    // =========================================================================
    // 16.H: Anonymous Private Project (Anonymous -> 404 anti-IDOR)
    // =========================================================================

    @Test
    @DisplayName("H. Anonymous access to private project snapshot (Anonymous -> 404 Not Found)")
    void testAnonymousPrivateProject_404() throws Exception {
        GovernanceIndicatorSnapshot snap1 = createProjectSnapshot(
                activeParcelDef, privateProjectA, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("50.0000"), new BigDecimal("200.0000"),
                "{\"active\": 50}", "1.0");

        String payload = """
                {
                    "baselineSnapshotId": "%s",
                    "compareToLive": true
                }
                """.formatted(snap1.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    // =========================================================================
    // 16.I: Project Snapshot -> LIVE (Authorized Member -> 200 OK)
    // =========================================================================

    @Test
    @DisplayName("I. Project snapshot vs LIVE (Authorized Project Member -> 200 OK)")
    void testProjectSnapshotVsLive_AuthorizedMember_200() throws Exception {
        GovernanceIndicatorSnapshot snap1 = createProjectSnapshot(
                activeParcelDef, privateProjectA, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("50.0000"), new BigDecimal("200.0000"),
                "{\"active\": 50}", "1.0");

        String payload = """
                {
                    "baselineSnapshotId": "%s",
                    "compareToLive": true
                }
                """.formatted(snap1.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .cookie(authCookie(researcherUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scopeType").value("PROJECT"))
                .andExpect(jsonPath("$.projectId").value(privateProjectA.getId().toString()))
                .andExpect(jsonPath("$.target.isLive").value(true));
    }

    // =========================================================================
    // 16.J: Unauthorized Project Snapshot -> LIVE (404 anti-IDOR)
    // =========================================================================

    @Test
    @DisplayName("J. Unauthorized project snapshot vs LIVE (Non-member -> 404 Not Found)")
    void testUnauthorizedProjectSnapshotVsLive_404() throws Exception {
        GovernanceIndicatorSnapshot snap1 = createProjectSnapshot(
                activeParcelDef, privateProjectA, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("50.0000"), new BigDecimal("200.0000"),
                "{\"active\": 50}", "1.0");

        String payload = """
                {
                    "baselineSnapshotId": "%s",
                    "compareToLive": true
                }
                """.formatted(snap1.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .cookie(authCookie(outsiderUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    // =========================================================================
    // 17: Cross-Project Security Test (CRITICAL)
    // =========================================================================

    @Test
    @DisplayName("17. Case 1: Caller cannot access Project B -> 404 Not Found (conception concealed)")
    void testCrossProjectSecurity_UnauthorizedTargetProject_Returns404() throws Exception {
        // Project A: researcher is member. Project B: researcher is NOT member.
        GovernanceIndicatorSnapshot snapA = createProjectSnapshot(
                activeParcelDef, privateProjectA, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("50.0000"), new BigDecimal("200.0000"),
                "{\"active\": 50}", "1.0");

        GovernanceIndicatorSnapshot snapB = createProjectSnapshot(
                activeParcelDef, privateProjectB, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("60.0000"), new BigDecimal("200.0000"),
                "{\"active\": 60}", "1.0");

        String payload = """
                {
                    "baselineSnapshotId": "%s",
                    "targetSnapshotId": "%s",
                    "compareToLive": false
                }
                """.formatted(snapA.getId(), snapB.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .cookie(authCookie(researcherUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("17. Case 2: Caller authorized for BOTH projects -> 400 Bad Request (scope incompatibility)")
    void testCrossProjectSecurity_BothAuthorizedIncompatibleScope_Returns400() throws Exception {
        // Admin user is authorized for BOTH Project A and Project B.
        GovernanceIndicatorSnapshot snapA = createProjectSnapshot(
                activeParcelDef, privateProjectA, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("50.0000"), new BigDecimal("200.0000"),
                "{\"active\": 50}", "1.0");

        GovernanceIndicatorSnapshot snapB = createProjectSnapshot(
                activeParcelDef, privateProjectB, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("60.0000"), new BigDecimal("200.0000"),
                "{\"active\": 60}", "1.0");

        String payload = """
                {
                    "baselineSnapshotId": "%s",
                    "targetSnapshotId": "%s",
                    "compareToLive": false
                }
                """.formatted(snapA.getId(), snapB.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .cookie(authCookie(adminUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Cannot compare snapshots from different projects")));
    }

    // =========================================================================
    // 18: Semantic Validation Tests
    // =========================================================================

    @Test
    @DisplayName("18. Different indicator definitions -> 400 Bad Request")
    void testSemanticValidation_DifferentIndicators_400() throws Exception {
        GovernanceIndicatorSnapshot snap1 = createRegionalSnapshot(
                activeParcelDef, GovernanceScopeType.DISTRICT, testState, testDistrictBhopal,
                SnapshotVisibility.PUBLISHED, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("100.0000"), new BigDecimal("1000.0000"),
                "{}", "1.0");

        GovernanceIndicatorSnapshot snap2 = createRegionalSnapshot(
                disputedParcelDef, GovernanceScopeType.DISTRICT, testState, testDistrictBhopal,
                SnapshotVisibility.PUBLISHED, Instant.parse("2026-02-01T00:00:00Z"),
                new BigDecimal("20.0000"), new BigDecimal("1000.0000"),
                "{}", "1.0");

        String payload = """
                {
                    "baselineSnapshotId": "%s",
                    "targetSnapshotId": "%s",
                    "compareToLive": false
                }
                """.formatted(snap1.getId(), snap2.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Cannot compare snapshots of different indicators")));
    }

    @Test
    @DisplayName("18. Different scope types -> 400 Bad Request")
    void testSemanticValidation_DifferentScopeTypes_400() throws Exception {
        GovernanceIndicatorSnapshot snapDist = createRegionalSnapshot(
                activeParcelDef, GovernanceScopeType.DISTRICT, testState, testDistrictBhopal,
                SnapshotVisibility.PUBLISHED, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("100.0000"), new BigDecimal("1000.0000"),
                "{}", "1.0");

        GovernanceIndicatorSnapshot snapState = createRegionalSnapshot(
                activeParcelDef, GovernanceScopeType.STATE, testState, null,
                SnapshotVisibility.PUBLISHED, Instant.parse("2026-02-01T00:00:00Z"),
                new BigDecimal("500.0000"), new BigDecimal("5000.0000"),
                "{}", "1.0");

        String payload = """
                {
                    "baselineSnapshotId": "%s",
                    "targetSnapshotId": "%s",
                    "compareToLive": false
                }
                """.formatted(snapDist.getId(), snapState.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Cannot compare snapshots with different scope types")));
    }

    @Test
    @DisplayName("18. Different geographic scope (Bhopal vs Indore) -> 400 Bad Request")
    void testSemanticValidation_DifferentGeographicScope_400() throws Exception {
        GovernanceIndicatorSnapshot snapBhopal = createRegionalSnapshot(
                activeParcelDef, GovernanceScopeType.DISTRICT, testState, testDistrictBhopal,
                SnapshotVisibility.PUBLISHED, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("100.0000"), new BigDecimal("1000.0000"),
                "{}", "1.0");

        GovernanceIndicatorSnapshot snapIndore = createRegionalSnapshot(
                activeParcelDef, GovernanceScopeType.DISTRICT, testState, testDistrictIndore,
                SnapshotVisibility.PUBLISHED, Instant.parse("2026-02-01T00:00:00Z"),
                new BigDecimal("120.0000"), new BigDecimal("1000.0000"),
                "{}", "1.0");

        String payload = """
                {
                    "baselineSnapshotId": "%s",
                    "targetSnapshotId": "%s",
                    "compareToLive": false
                }
                """.formatted(snapBhopal.getId(), snapIndore.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("mismatched district")));
    }

    @Test
    @DisplayName("18. Self comparison (same snapshot ID) -> 400 Bad Request")
    void testSemanticValidation_SelfComparison_400() throws Exception {
        GovernanceIndicatorSnapshot snap = createRegionalSnapshot(
                activeParcelDef, GovernanceScopeType.DISTRICT, testState, testDistrictBhopal,
                SnapshotVisibility.PUBLISHED, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("100.0000"), new BigDecimal("1000.0000"),
                "{}", "1.0");

        String payload = """
                {
                    "baselineSnapshotId": "%s",
                    "targetSnapshotId": "%s",
                    "compareToLive": false
                }
                """.formatted(snap.getId(), snap.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot compare a snapshot with itself"));
    }

    // =========================================================================
    // 19: Malformed Request Tests
    // =========================================================================

    @Test
    @DisplayName("19. Missing body -> 400 Bad Request")
    void testMalformedRequest_MissingBody_400() throws Exception {
        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("19. Invalid JSON -> 400 Bad Request")
    void testMalformedRequest_InvalidJson_400() throws Exception {
        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ invalid json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Request body is missing or malformed"));
    }

    @Test
    @DisplayName("19. Invalid UUID -> 400 Bad Request")
    void testMalformedRequest_InvalidUuid_400() throws Exception {
        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"baselineSnapshotId\": \"not-a-valid-uuid\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Request body is missing or malformed"));
    }

    @Test
    @DisplayName("19. Missing baselineSnapshotId -> 400 Bad Request")
    void testMalformedRequest_MissingBaselineSnapshotId_400() throws Exception {
        String payload = """
                {
                    "targetSnapshotId": "%s",
                    "compareToLive": false
                }
                """.formatted(UUID.randomUUID());

        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.baselineSnapshotId").value("baselineSnapshotId is required"));
    }

    // =========================================================================
    // 20 & 21: Response Assertions & Statutory Evidence Delta & Privacy
    // =========================================================================

    @Test
    @DisplayName("20 & 21. Comprehensive response structure, neutral directionality, and statutory evidence diff")
    void testResponseAssertions_EvidenceDeltaAndPrivacy() throws Exception {
        ResearchDocument doc1 = researchDocumentRepository.save(new ResearchDocument(
                "Doc 1 " + testSuffix, "Desc 1", DocumentType.GOVERNMENT_REPORT,
                "Govt", "Dept", null, null, null, "en", null, null,
                ResearchDocumentStatus.PUBLISHED, adminUser));

        ResearchDocument doc2 = researchDocumentRepository.save(new ResearchDocument(
                "Doc 2 " + testSuffix, "Desc 2", DocumentType.GOVERNMENT_REPORT,
                "Govt", "Dept", null, null, null, "en", null, null,
                ResearchDocumentStatus.PUBLISHED, adminUser));

        ResearchDocument doc3 = researchDocumentRepository.save(new ResearchDocument(
                "Doc 3 " + testSuffix, "Desc 3", DocumentType.GOVERNMENT_REPORT,
                "Govt", "Dept", null, null, null, "en", null, null,
                ResearchDocumentStatus.PUBLISHED, adminUser));

        GovernanceIndicatorSnapshot snap1 = createRegionalSnapshot(
                activeParcelDef, GovernanceScopeType.DISTRICT, testState, testDistrictBhopal,
                SnapshotVisibility.PUBLISHED, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("100.0000"), new BigDecimal("1000.0000"),
                "{\"active\": 100, \"residential\": 60, \"commercial\": 40}", "1.0");

        GovernanceIndicatorSnapshot snap2 = createRegionalSnapshot(
                activeParcelDef, GovernanceScopeType.DISTRICT, testState, testDistrictBhopal,
                SnapshotVisibility.PUBLISHED, Instant.parse("2026-07-01T00:00:00Z"),
                new BigDecimal("150.0000"), new BigDecimal("1200.0000"),
                "{\"active\": 150, \"residential\": 80, \"commercial\": 70}", "1.0");

        // Link Evidence:
        // snap1 has doc1 and doc2 (doc2 will be COMMON, doc1 will be REMOVED)
        evidenceRepository.save(new GovernanceIndicatorEvidence(
                snap1, doc1, null, GovernanceEvidenceType.POLICY_FRAMEWORK, "Rationale 1", new BigDecimal("0.8500"), adminUser));
        evidenceRepository.save(new GovernanceIndicatorEvidence(
                snap1, doc2, null, GovernanceEvidenceType.STATUTORY_BENCHMARK, "Rationale 2", new BigDecimal("0.9000"), adminUser));

        // snap2 has doc2 and doc3 (doc2 is COMMON, doc3 is ADDED)
        evidenceRepository.save(new GovernanceIndicatorEvidence(
                snap2, doc2, null, GovernanceEvidenceType.STATUTORY_BENCHMARK, "Rationale 2", new BigDecimal("0.9000"), adminUser));
        evidenceRepository.save(new GovernanceIndicatorEvidence(
                snap2, doc3, null, GovernanceEvidenceType.AUDIT_PRECEDENT, "Rationale 3", new BigDecimal("0.9500"), adminUser));

        String payload = """
                {
                    "baselineSnapshotId": "%s",
                    "targetSnapshotId": "%s",
                    "compareToLive": false
                }
                """.formatted(snap1.getId(), snap2.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                // Basic definitions
                .andExpect(jsonPath("$.indicatorCode").value("ACTIVE_PARCEL_COUNT"))
                .andExpect(jsonPath("$.indicatorName").isNotEmpty())
                .andExpect(jsonPath("$.category").value("STATUS_DISTRIBUTION"))
                .andExpect(jsonPath("$.unit").value("COUNT"))
                .andExpect(jsonPath("$.scopeType").value("DISTRICT"))
                // Milestones
                .andExpect(jsonPath("$.baseline.snapshotId").value(snap1.getId().toString()))
                .andExpect(jsonPath("$.baseline.evidenceCount").value(2))
                .andExpect(jsonPath("$.target.snapshotId").value(snap2.getId().toString()))
                .andExpect(jsonPath("$.target.evidenceCount").value(2))
                // Quantitative variance & neutral direction
                .andExpect(jsonPath("$.quantitativeVariance.absoluteDelta").value(50.0))
                .andExpect(jsonPath("$.quantitativeVariance.percentageChange").value(50.0))
                .andExpect(jsonPath("$.quantitativeVariance.percentageChangeDefined").value(true))
                .andExpect(jsonPath("$.quantitativeVariance.trendDirection").value("NOT_DEFINED"))
                .andExpect(jsonPath("$.quantitativeVariance.denominatorDelta").value(200.0))
                // Breakdown variances
                .andExpect(jsonPath("$.breakdownVariances").isArray())
                // Evidence delta
                .andExpect(jsonPath("$.evidenceDelta.commonEvidenceCount").value(1))
                .andExpect(jsonPath("$.evidenceDelta.addedEvidenceCount").value(1))
                .andExpect(jsonPath("$.evidenceDelta.removedEvidenceCount").value(1))
                // Versioning and elapsed days
                .andExpect(jsonPath("$.calculationVersionMismatch").value(false))
                .andExpect(jsonPath("$.elapsedDays").value(181))
                .andExpect(jsonPath("$.chronologicalReversal").value(false))
                // Privacy assertion: Ensure no creator user IDs or citizen PII leaked in milestone
                .andExpect(jsonPath("$.baseline.generatedById").doesNotExist())
                .andExpect(jsonPath("$.baseline.generatedByName").doesNotExist())
                .andExpect(jsonPath("$.target.generatedById").doesNotExist())
                .andExpect(jsonPath("$.target.generatedByName").doesNotExist());
    }

    // =========================================================================
    // 22: Read-Only Guarantee Integration Test
    // =========================================================================

    @Test
    @DisplayName("22. Read-only guarantee: Snapshot vs LIVE must not mutate database")
    void testReadOnlyGuarantee_SnapshotVsLive_NoDatabaseMutation() throws Exception {
        GovernanceIndicatorSnapshot snap = createRegionalSnapshot(
                activeParcelDef, GovernanceScopeType.DISTRICT, testState, testDistrictBhopal,
                SnapshotVisibility.PUBLISHED, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("100.0000"), new BigDecimal("1000.0000"),
                "{\"active\": 100}", "1.0");

        long snapshotsBefore = snapshotRepository.count();
        long evidenceBefore = evidenceRepository.count();

        String payload = """
                {
                    "baselineSnapshotId": "%s",
                    "compareToLive": true
                }
                """.formatted(snap.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());

        long snapshotsAfter = snapshotRepository.count();
        long evidenceAfter = evidenceRepository.count();

        assertThat(snapshotsAfter).isEqualTo(snapshotsBefore);
        assertThat(evidenceAfter).isEqualTo(evidenceBefore);
    }

    // =========================================================================
    // 23: Security Regression Test
    // =========================================================================

    @Test
    @DisplayName("23. Security regression: permitAll() on endpoint does not bypass service authorization")
    void testSecurityRegression_PermitAllDoesNotBypassAuthorization() throws Exception {
        // 1. Internal regional snapshot -> Anonymous gets 404
        GovernanceIndicatorSnapshot intSnap = createRegionalSnapshot(
                activeParcelDef, GovernanceScopeType.DISTRICT, testState, testDistrictBhopal,
                SnapshotVisibility.INTERNAL, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("100.0000"), new BigDecimal("1000.0000"),
                "{}", "1.0");

        String payload1 = """
                {
                    "baselineSnapshotId": "%s",
                    "compareToLive": true
                }
                """.formatted(intSnap.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload1))
                .andExpect(status().isNotFound());

        // 2. Private project snapshot -> Anonymous gets 404
        GovernanceIndicatorSnapshot projSnap = createProjectSnapshot(
                activeParcelDef, privateProjectA, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("50.0000"), new BigDecimal("200.0000"),
                "{}", "1.0");

        String payload2 = """
                {
                    "baselineSnapshotId": "%s",
                    "compareToLive": true
                }
                """.formatted(projSnap.getId());

        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload2))
                .andExpect(status().isNotFound());
    }
}
