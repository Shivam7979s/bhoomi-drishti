package com.bhoomidrishti.governance;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.auth.security.JwtService;
import com.bhoomidrishti.governance.controller.GovernanceIndicatorController;
import com.bhoomidrishti.governance.dto.CreateGovernanceSnapshotRequest;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorDefinitionResponse;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorEvidenceResponse;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorSnapshotResponse;
import com.bhoomidrishti.governance.dto.LinkGovernanceEvidenceRequest;
import com.bhoomidrishti.governance.entity.AggregationMethod;
import com.bhoomidrishti.governance.entity.GovernanceEvidenceType;
import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import com.bhoomidrishti.governance.entity.IndicatorCategory;
import com.bhoomidrishti.governance.entity.IndicatorUnit;
import com.bhoomidrishti.governance.entity.SnapshotVisibility;
import com.bhoomidrishti.governance.service.GovernanceIndicatorService;
import com.bhoomidrishti.testconfig.SecurityTestConfiguration;
import jakarta.servlet.http.Cookie;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import com.bhoomidrishti.governance.dto.GovernanceAdministrativeSummaryResponse;
import com.bhoomidrishti.governance.dto.GovernanceScopeSummaryResponse;
import com.bhoomidrishti.governance.dto.GovernanceSummaryIndicatorItemResponse;
import com.bhoomidrishti.governance.entity.AggregationMethod;
import com.bhoomidrishti.governance.dto.GovernanceComparisonRequest;
import com.bhoomidrishti.governance.dto.GovernanceComparisonResponse;
import com.bhoomidrishti.governance.dto.GovernanceEvidenceDeltaDTO;
import com.bhoomidrishti.governance.dto.GovernanceMetricDeltaDTO;
import com.bhoomidrishti.governance.dto.GovernanceMilestoneDTO;
import com.bhoomidrishti.governance.service.GovernanceComparisonService;
import com.bhoomidrishti.governance.service.GovernanceQueryService;
import java.util.Collections;
import org.mockito.ArgumentCaptor;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(GovernanceIndicatorController.class)
@Import(SecurityTestConfiguration.class)
class GovernanceIndicatorControllerTest {

    private static final String SESSION_COOKIE = "bhoomi_auth";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @MockitoBean
    private GovernanceIndicatorService governanceIndicatorService;

    @MockitoBean
    private GovernanceQueryService governanceQueryService;

    @MockitoBean
    private GovernanceComparisonService governanceComparisonService;

    @MockitoBean
    private UserRepository userRepository;

    private Cookie mockAuthCookie(Role role, String email) {
        User user = User.registerLocal("Test User", email, "hash");
        user.changeRole(role);
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());

        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        String token = jwtService.generateToken(user);
        return new Cookie(SESSION_COOKIE, token);
    }

    @Test
    @DisplayName("GET /api/governance/indicators - Public metadata query")
    void testGetIndicators() throws Exception {
        GovernanceIndicatorDefinitionResponse def = new GovernanceIndicatorDefinitionResponse(
                UUID.randomUUID(),
                "PARCEL_COUNT_BY_LAND_USE",
                "Parcel Count by Land Use",
                "Description",
                IndicatorCategory.LAND_USE,
                IndicatorUnit.COUNT,
                AggregationMethod.COUNT,
                "LAND_RECORD",
                "1.0",
                true,
                Instant.now(),
                Instant.now());

        when(governanceIndicatorService.getIndicatorDefinitions(null)).thenReturn(List.of(def));

        mockMvc.perform(get("/api/governance/indicators"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("PARCEL_COUNT_BY_LAND_USE"))
                .andExpect(jsonPath("$[0].category").value("LAND_USE"))
                .andExpect(jsonPath("$[0].aggregationMethod").value("COUNT"));
    }

    @Test
    @DisplayName("GET /api/governance/indicators/{code} - Public definition detail")
    void testGetIndicatorByCode() throws Exception {
        GovernanceIndicatorDefinitionResponse def = new GovernanceIndicatorDefinitionResponse(
                UUID.randomUUID(),
                "AREA_BY_LAND_USE",
                "Area by Land Use",
                "Description",
                IndicatorCategory.LAND_USE,
                IndicatorUnit.SQ_METERS,
                AggregationMethod.SUM,
                "LAND_RECORD",
                "1.0",
                true,
                Instant.now(),
                Instant.now());

        when(governanceIndicatorService.getIndicatorDefinitionByCode("AREA_BY_LAND_USE")).thenReturn(def);

        mockMvc.perform(get("/api/governance/indicators/AREA_BY_LAND_USE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("AREA_BY_LAND_USE"))
                .andExpect(jsonPath("$.unit").value("SQ_METERS"));
    }

    @Test
    @DisplayName("POST /api/governance/snapshots - Created (201)")
    void testCreateSnapshot() throws Exception {
        UUID snapshotId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        GovernanceIndicatorSnapshotResponse res = new GovernanceIndicatorSnapshotResponse(
                snapshotId,
                UUID.randomUUID(),
                "ACTIVE_PARCEL_COUNT",
                "Active Parcel Count",
                IndicatorCategory.STATUS_DISTRIBUTION,
                IndicatorUnit.COUNT,
                null,
                GovernanceScopeType.DISTRICT,
                "Madhya Pradesh",
                "Bhopal",
                null,
                null,
                SnapshotVisibility.INTERNAL,
                Instant.parse("2026-09-24T00:00:00Z"),
                null,
                null,
                BigDecimal.valueOf(450),
                BigDecimal.valueOf(500),
                "{\"active\": 450}",
                "1.0",
                Instant.parse("2026-09-24T00:00:00Z"),
                "v1",
                userId,
                "Admin Officer",
                Instant.now(),
                0);

        when(governanceIndicatorService.createSnapshot(any(CreateGovernanceSnapshotRequest.class), any()))
                .thenReturn(res);

        String json = """
                {
                    "indicatorCode": "ACTIVE_PARCEL_COUNT",
                    "scopeType": "DISTRICT",
                    "state": "Madhya Pradesh",
                    "district": "Bhopal",
                    "visibility": "INTERNAL",
                    "asOf": "2026-09-24T00:00:00Z",
                    "sourceDataVersion": "v1"
                }
                """;

        mockMvc.perform(post("/api/governance/snapshots")
                        .cookie(mockAuthCookie(Role.GOVERNMENT_OFFICIAL, "officer@bhoomi.gov.in"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(snapshotId.toString()))
                .andExpect(jsonPath("$.indicatorCode").value("ACTIVE_PARCEL_COUNT"))
                .andExpect(jsonPath("$.numericValue").value(450));
    }

    @Test
    @DisplayName("GET /api/governance/snapshots/{id} - Retrieve snapshot")
    void testGetSnapshotById() throws Exception {
        UUID snapshotId = UUID.randomUUID();
        GovernanceIndicatorSnapshotResponse res = new GovernanceIndicatorSnapshotResponse(
                snapshotId,
                UUID.randomUUID(),
                "ACTIVE_PARCEL_COUNT",
                "Active Parcel Count",
                IndicatorCategory.STATUS_DISTRIBUTION,
                IndicatorUnit.COUNT,
                null,
                GovernanceScopeType.DISTRICT,
                "Madhya Pradesh",
                "Bhopal",
                null,
                null,
                SnapshotVisibility.INTERNAL,
                Instant.parse("2026-09-24T00:00:00Z"),
                null,
                null,
                BigDecimal.valueOf(450),
                null,
                null,
                "1.0",
                Instant.parse("2026-09-24T00:00:00Z"),
                null,
                UUID.randomUUID(),
                "Admin Officer",
                Instant.now(),
                0);

        when(governanceIndicatorService.getSnapshotById(eq(snapshotId), any())).thenReturn(res);

        mockMvc.perform(get("/api/governance/snapshots/" + snapshotId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(snapshotId.toString()))
                .andExpect(jsonPath("$.indicatorCode").value("ACTIVE_PARCEL_COUNT"));
    }

    @Test
    @DisplayName("POST /api/governance/snapshots/{id}/evidence - Link evidence (201)")
    void testLinkEvidence() throws Exception {
        UUID snapshotId = UUID.randomUUID();
        UUID evidenceId = UUID.randomUUID();
        UUID docId = UUID.randomUUID();

        GovernanceIndicatorEvidenceResponse res = new GovernanceIndicatorEvidenceResponse(
                evidenceId,
                snapshotId,
                docId,
                null,
                "National Land Record Modernization Report",
                "GOVERNMENT_REPORT",
                null,
                null,
                null,
                GovernanceEvidenceType.POLICY_FRAMEWORK,
                new BigDecimal("0.9200"),
                "National statutory guideline for parcel digitization",
                UUID.randomUUID(),
                "Admin Officer",
                Instant.now());

        when(governanceIndicatorService.linkEvidence(eq(snapshotId), any(LinkGovernanceEvidenceRequest.class), any()))
                .thenReturn(res);

        String json = """
                {
                    "researchDocumentId": "%s",
                    "evidenceType": "POLICY_FRAMEWORK",
                    "rationale": "National statutory guideline for parcel digitization",
                    "similarityScore": 0.9200
                }
                """.formatted(docId);

        mockMvc.perform(post("/api/governance/snapshots/" + snapshotId + "/evidence")
                        .cookie(mockAuthCookie(Role.GOVERNMENT_OFFICIAL, "officer@bhoomi.gov.in"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(evidenceId.toString()))
                .andExpect(jsonPath("$.evidenceType").value("POLICY_FRAMEWORK"))
                .andExpect(jsonPath("$.similarityScore").value(0.92));
    }

    @Test
    @DisplayName("DELETE /api/governance/snapshots/{id}/evidence/{evidenceId} - Unlink evidence (204)")
    void testUnlinkEvidence() throws Exception {
        UUID snapshotId = UUID.randomUUID();
        UUID evidenceId = UUID.randomUUID();

        doNothing().when(governanceIndicatorService).unlinkEvidence(eq(snapshotId), eq(evidenceId), any(Authentication.class));

        mockMvc.perform(delete("/api/governance/snapshots/" + snapshotId + "/evidence/" + evidenceId)
                        .cookie(mockAuthCookie(Role.GOVERNMENT_OFFICIAL, "officer@bhoomi.gov.in")))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("GET /api/governance/snapshots - Retrieve snapshots by scope hierarchy")
    void testGetSnapshotsByScopeHierarchy() throws Exception {
        UUID snapshotId = UUID.randomUUID();
        GovernanceIndicatorSnapshotResponse res = new GovernanceIndicatorSnapshotResponse(
                snapshotId,
                UUID.randomUUID(),
                "ACTIVE_PARCEL_COUNT",
                "Active Parcel Count",
                IndicatorCategory.STATUS_DISTRIBUTION,
                IndicatorUnit.COUNT,
                null,
                GovernanceScopeType.DISTRICT,
                "Madhya Pradesh",
                "Bhopal",
                "Huzur",
                null,
                SnapshotVisibility.PUBLISHED,
                Instant.parse("2026-09-24T00:00:00Z"),
                null,
                null,
                BigDecimal.valueOf(450),
                null,
                null,
                "1.0",
                Instant.parse("2026-09-24T00:00:00Z"),
                null,
                UUID.randomUUID(),
                "Admin Officer",
                Instant.now(),
                0);

        when(governanceIndicatorService.getSnapshotsByScope(
                eq(GovernanceScopeType.DISTRICT),
                eq("Madhya Pradesh"),
                eq("Bhopal"),
                eq("Huzur"),
                eq(null),
                eq("ACTIVE_PARCEL_COUNT"),
                any()))
                .thenReturn(List.of(res));

        mockMvc.perform(get("/api/governance/snapshots")
                        .param("scopeType", "DISTRICT")
                        .param("state", "Madhya Pradesh")
                        .param("district", "Bhopal")
                        .param("tehsil", "Huzur")
                        .param("indicatorCode", "ACTIVE_PARCEL_COUNT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(snapshotId.toString()))
                .andExpect(jsonPath("$[0].scopeType").value("DISTRICT"))
                .andExpect(jsonPath("$[0].district").value("Bhopal"))
                .andExpect(jsonPath("$[0].tehsil").value("Huzur"));
    }

    @Test
    @DisplayName("GET /api/projects/{projectId}/governance-snapshots - Retrieve project snapshots")
    void testGetSnapshotsByProject() throws Exception {
        UUID projectId = UUID.randomUUID();
        UUID snapshotId = UUID.randomUUID();
        GovernanceIndicatorSnapshotResponse res = new GovernanceIndicatorSnapshotResponse(
                snapshotId,
                UUID.randomUUID(),
                "ACTIVE_PARCEL_COUNT",
                "Active Parcel Count",
                IndicatorCategory.STATUS_DISTRIBUTION,
                IndicatorUnit.COUNT,
                projectId,
                GovernanceScopeType.PROJECT,
                null,
                null,
                null,
                null,
                SnapshotVisibility.INTERNAL,
                Instant.parse("2026-09-24T00:00:00Z"),
                null,
                null,
                BigDecimal.valueOf(12),
                null,
                null,
                "1.0",
                Instant.parse("2026-09-24T00:00:00Z"),
                null,
                UUID.randomUUID(),
                "Lead Researcher",
                Instant.now(),
                0);

        when(governanceIndicatorService.getSnapshotsByProject(eq(projectId), any()))
                .thenReturn(List.of(res));

        mockMvc.perform(get("/api/projects/" + projectId + "/governance-snapshots"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(snapshotId.toString()))
                .andExpect(jsonPath("$[0].projectId").value(projectId.toString()))
                .andExpect(jsonPath("$[0].scopeType").value("PROJECT"));
    }

    // =========================================================================
    // Administrative Summary Tests
    // =========================================================================

    @Test
    @DisplayName("GET /api/governance/summary - Retrieve live administrative summary for district")
    void testGetAdministrativeSummarySuccess() throws Exception {
        GovernanceScopeSummaryResponse scopeRes = new GovernanceScopeSummaryResponse(
                GovernanceScopeType.DISTRICT, "Madhya Pradesh", "Bhopal", null, null, null, null);
        GovernanceSummaryIndicatorItemResponse item = new GovernanceSummaryIndicatorItemResponse(
                "ACTIVE_PARCEL_COUNT",
                "Active Cadastral Parcel Count",
                IndicatorCategory.STATUS_DISTRIBUTION,
                IndicatorUnit.COUNT,
                AggregationMethod.COUNT,
                BigDecimal.valueOf(450),
                BigDecimal.valueOf(500),
                "{\"activeParcels\":450,\"totalParcels\":500}",
                Instant.parse("2026-09-24T00:00:00Z"));

        GovernanceAdministrativeSummaryResponse summaryRes = new GovernanceAdministrativeSummaryResponse(
                scopeRes,
                "LIVE",
                Instant.parse("2026-09-24T01:00:00Z"),
                Instant.parse("2026-09-24T00:00:00Z"),
                "1.0",
                1,
                List.of(item));

        when(governanceQueryService.generateAdministrativeSummary(any(), any(), any(), any()))
                .thenReturn(summaryRes);

        mockMvc.perform(get("/api/governance/summary")
                        .param("scopeType", "DISTRICT")
                        .param("state", "Madhya Pradesh")
                        .param("district", "Bhopal"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summaryMode").value("LIVE"))
                .andExpect(jsonPath("$.scope.scopeType").value("DISTRICT"))
                .andExpect(jsonPath("$.scope.state").value("Madhya Pradesh"))
                .andExpect(jsonPath("$.scope.district").value("Bhopal"))
                .andExpect(jsonPath("$.totalIndicatorsEvaluated").value(1))
                .andExpect(jsonPath("$.indicators[0].indicatorCode").value("ACTIVE_PARCEL_COUNT"))
                .andExpect(jsonPath("$.indicators[0].numericValue").value(450));
    }

    @Test
    @DisplayName("GET /api/governance/summary - Retrieve summary with category filter")
    void testGetAdministrativeSummaryCategoryFilter() throws Exception {
        GovernanceScopeSummaryResponse scopeRes = new GovernanceScopeSummaryResponse(
                GovernanceScopeType.STATE, "Madhya Pradesh", null, null, null, null, null);
        GovernanceAdministrativeSummaryResponse summaryRes = new GovernanceAdministrativeSummaryResponse(
                scopeRes, "LIVE", Instant.now(), Instant.now(), "1.0", 0, List.of());

        when(governanceQueryService.generateAdministrativeSummary(
                any(), eq(IndicatorCategory.LAND_USE), any(), any()))
                .thenReturn(summaryRes);

        mockMvc.perform(get("/api/governance/summary")
                        .param("scopeType", "STATE")
                        .param("state", "Madhya Pradesh")
                        .param("category", "LAND_USE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summaryMode").value("LIVE"))
                .andExpect(jsonPath("$.scope.scopeType").value("STATE"));
    }

    @Test
    @DisplayName("GET /api/governance/summary - Retrieve summary with explicit indicators list")
    void testGetAdministrativeSummaryExplicitIndicators() throws Exception {
        GovernanceScopeSummaryResponse scopeRes = new GovernanceScopeSummaryResponse(
                GovernanceScopeType.DISTRICT, "Madhya Pradesh", "Bhopal", null, null, null, null);
        GovernanceAdministrativeSummaryResponse summaryRes = new GovernanceAdministrativeSummaryResponse(
                scopeRes, "LIVE", Instant.now(), Instant.now(), "1.0", 2, List.of());

        when(governanceQueryService.generateAdministrativeSummary(
                any(), any(), eq(List.of("ACTIVE_PARCEL_COUNT", "DISPUTED_PARCEL_COUNT")), any()))
                .thenReturn(summaryRes);

        mockMvc.perform(get("/api/governance/summary")
                        .param("scopeType", "DISTRICT")
                        .param("state", "Madhya Pradesh")
                        .param("district", "Bhopal")
                        .param("indicators", "ACTIVE_PARCEL_COUNT", "DISPUTED_PARCEL_COUNT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summaryMode").value("LIVE"))
                .andExpect(jsonPath("$.totalIndicatorsEvaluated").value(2));
    }

    @Test
    @DisplayName("GET /api/governance/summary - Project scope summary includes projectName")
    void testGetAdministrativeSummaryProjectScope() throws Exception {
        UUID projectId = UUID.randomUUID();
        GovernanceScopeSummaryResponse scopeRes = new GovernanceScopeSummaryResponse(
                GovernanceScopeType.PROJECT, null, null, null, null, projectId, "Smart Land Registry");
        GovernanceAdministrativeSummaryResponse summaryRes = new GovernanceAdministrativeSummaryResponse(
                scopeRes, "LIVE", Instant.now(), Instant.now(), "1.0", 1, List.of());

        when(governanceQueryService.generateAdministrativeSummary(any(), any(), any(), any()))
                .thenReturn(summaryRes);

        mockMvc.perform(get("/api/governance/summary")
                        .param("scopeType", "PROJECT")
                        .param("projectId", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scope.scopeType").value("PROJECT"))
                .andExpect(jsonPath("$.scope.projectId").value(projectId.toString()))
                .andExpect(jsonPath("$.scope.projectName").value("Smart Land Registry"));
    }

    @Test
    @DisplayName("GET /api/governance/summary - Invalid scope hierarchy returns 400 Bad Request")
    void testGetAdministrativeSummaryValidationError() throws Exception {
        when(governanceQueryService.generateAdministrativeSummary(any(), any(), any(), any()))
                .thenThrow(new IllegalArgumentException("state and district are required for DISTRICT scope type"));

        mockMvc.perform(get("/api/governance/summary")
                        .param("scopeType", "DISTRICT")
                        .param("state", "Madhya Pradesh"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/governance/summary - Unauthorized or nonexistent project returns 404 Not Found")
    void testGetAdministrativeSummaryProjectNotFound() throws Exception {
        UUID projectId = UUID.randomUUID();
        when(governanceQueryService.generateAdministrativeSummary(any(), any(), any(), any()))
                .thenThrow(new com.bhoomidrishti.exception.ResourceNotFoundException("Project not found"));

        mockMvc.perform(get("/api/governance/summary")
                        .param("scopeType", "PROJECT")
                        .param("projectId", projectId.toString()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/governance/summary - Unauthorized authenticated user for private project returns 404")
    void testGetAdministrativeSummaryProjectUnauthorizedAuthenticated() throws Exception {
        UUID projectId = UUID.randomUUID();
        when(governanceQueryService.generateAdministrativeSummary(any(), any(), any(), any()))
                .thenThrow(new com.bhoomidrishti.exception.ResourceNotFoundException("Project not found"));

        mockMvc.perform(get("/api/governance/summary")
                        .cookie(mockAuthCookie(Role.RESEARCHER, "outsider@bhoomi.gov.in"))
                        .param("scopeType", "PROJECT")
                        .param("projectId", projectId.toString()))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // Comparison Endpoint WebMvc Tests (Phase 9B.5.2)
    // =========================================================================

    @Test
    @DisplayName("POST /api/governance/compare - Valid request returns 200 OK with GovernanceComparisonResponse")
    void testCompareSnapshots_Valid_Returns200() throws Exception {
        UUID snapshotA = UUID.randomUUID();
        UUID snapshotB = UUID.randomUUID();

        GovernanceMilestoneDTO milestoneA = new GovernanceMilestoneDTO(
                snapshotA, Instant.parse("2026-01-01T00:00:00Z"),
                new BigDecimal("100.0000"), new BigDecimal("1000.0000"),
                "1.0", false, 2);

        GovernanceMilestoneDTO milestoneB = new GovernanceMilestoneDTO(
                snapshotB, Instant.parse("2026-06-01T00:00:00Z"),
                new BigDecimal("150.0000"), new BigDecimal("1000.0000"),
                "1.0", false, 3);

        GovernanceMetricDeltaDTO metricDelta = new GovernanceMetricDeltaDTO(
                new BigDecimal("50.0000"), new BigDecimal("50.0000"), true,
                "NOT_DEFINED", BigDecimal.ZERO);

        GovernanceEvidenceDeltaDTO evidenceDelta = new GovernanceEvidenceDeltaDTO(
                1, 2, 1,
                Collections.emptyList(), Collections.emptyList(), Collections.emptyList());

        GovernanceComparisonResponse mockResponse = new GovernanceComparisonResponse(
                "ACTIVE_PARCEL_COUNT",
                "Active Parcel Count",
                IndicatorCategory.STATUS_DISTRIBUTION,
                IndicatorUnit.COUNT,
                GovernanceScopeType.DISTRICT,
                "Madhya Pradesh",
                "Bhopal",
                null,
                null,
                null,
                milestoneA,
                milestoneB,
                metricDelta,
                Collections.emptyList(),
                evidenceDelta,
                false,
                151L,
                false
        );

        when(governanceComparisonService.compareGovernanceSnapshots(any(GovernanceComparisonRequest.class), any()))
                .thenReturn(mockResponse);

        String json = """
                {
                    "baselineSnapshotId": "%s",
                    "targetSnapshotId": "%s",
                    "compareToLive": false
                }
                """.formatted(snapshotA, snapshotB);

        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.indicatorCode").value("ACTIVE_PARCEL_COUNT"))
                .andExpect(jsonPath("$.indicatorName").value("Active Parcel Count"))
                .andExpect(jsonPath("$.baseline.snapshotId").value(snapshotA.toString()))
                .andExpect(jsonPath("$.target.snapshotId").value(snapshotB.toString()))
                .andExpect(jsonPath("$.quantitativeVariance.absoluteDelta").value(50.0))
                .andExpect(jsonPath("$.quantitativeVariance.percentageChange").value(50.0))
                .andExpect(jsonPath("$.quantitativeVariance.trendDirection").value("NOT_DEFINED"))
                .andExpect(jsonPath("$.elapsedDays").value(151));
    }

    @Test
    @DisplayName("POST /api/governance/compare - Missing baselineSnapshotId returns 400 Bad Request")
    void testCompareSnapshots_MissingBaselineSnapshotId_Returns400() throws Exception {
        String json = """
                {
                    "targetSnapshotId": "%s",
                    "compareToLive": false
                }
                """.formatted(UUID.randomUUID());

        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.baselineSnapshotId").value("baselineSnapshotId is required"));
    }

    @Test
    @DisplayName("POST /api/governance/compare - Service IllegalArgumentException returns 400 Bad Request")
    void testCompareSnapshots_SemanticError_Returns400() throws Exception {
        when(governanceComparisonService.compareGovernanceSnapshots(any(GovernanceComparisonRequest.class), any()))
                .thenThrow(new IllegalArgumentException("Cannot compare snapshots of different indicators: ACTIVE_PARCEL_COUNT vs DISPUTED_PARCEL_COUNT"));

        String json = """
                {
                    "baselineSnapshotId": "%s",
                    "targetSnapshotId": "%s",
                    "compareToLive": false
                }
                """.formatted(UUID.randomUUID(), UUID.randomUUID());

        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot compare snapshots of different indicators: ACTIVE_PARCEL_COUNT vs DISPUTED_PARCEL_COUNT"));
    }

    @Test
    @DisplayName("POST /api/governance/compare - Service ResourceNotFoundException returns 404 Not Found")
    void testCompareSnapshots_NotFound_Returns404() throws Exception {
        UUID missingId = UUID.randomUUID();
        when(governanceComparisonService.compareGovernanceSnapshots(any(GovernanceComparisonRequest.class), any()))
                .thenThrow(new com.bhoomidrishti.exception.ResourceNotFoundException("Governance snapshot not found: " + missingId));

        String json = """
                {
                    "baselineSnapshotId": "%s",
                    "targetSnapshotId": "%s",
                    "compareToLive": false
                }
                """.formatted(missingId, UUID.randomUUID());

        mockMvc.perform(post("/api/governance/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Governance snapshot not found: " + missingId));
    }

    @Test
    @DisplayName("POST /api/governance/compare - Authentication context forwarded to service")
    void testCompareSnapshots_AuthenticationForwarded() throws Exception {
        UUID snapshotA = UUID.randomUUID();
        UUID snapshotB = UUID.randomUUID();

        when(governanceComparisonService.compareGovernanceSnapshots(any(GovernanceComparisonRequest.class), any()))
                .thenReturn(new GovernanceComparisonResponse(
                        "ACTIVE_PARCEL_COUNT", "Active Parcel Count",
                        IndicatorCategory.STATUS_DISTRIBUTION, IndicatorUnit.COUNT,
                        GovernanceScopeType.DISTRICT, "Madhya Pradesh", "Bhopal", null, null, null,
                        null, null, null, Collections.emptyList(), null, false, null, false
                ));

        String json = """
                {
                    "baselineSnapshotId": "%s",
                    "targetSnapshotId": "%s",
                    "compareToLive": false
                }
                """.formatted(snapshotA, snapshotB);

        mockMvc.perform(post("/api/governance/compare")
                        .cookie(mockAuthCookie(Role.GOVERNMENT_OFFICIAL, "officer@bhoomi.gov.in"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk());

        ArgumentCaptor<Authentication> authCaptor = ArgumentCaptor.forClass(Authentication.class);
        verify(governanceComparisonService).compareGovernanceSnapshots(any(GovernanceComparisonRequest.class), authCaptor.capture());
        assertThat(authCaptor.getValue()).isNotNull();
        assertThat(authCaptor.getValue().getPrincipal()).isInstanceOf(User.class);
        assertThat(((User) authCaptor.getValue().getPrincipal()).getEmail()).isEqualTo("officer@bhoomi.gov.in");
    }
}
