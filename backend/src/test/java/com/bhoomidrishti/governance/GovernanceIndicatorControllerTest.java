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
}
