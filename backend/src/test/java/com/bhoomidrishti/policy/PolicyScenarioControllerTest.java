package com.bhoomidrishti.policy;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.auth.security.JwtService;
import com.bhoomidrishti.common.PageResponse;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.policy.controller.PolicyScenarioController;
import com.bhoomidrishti.policy.dto.CreatePolicyScenarioRequest;
import com.bhoomidrishti.policy.dto.PolicyScenarioResponse;
import com.bhoomidrishti.policy.dto.ScenarioResultResponse;
import com.bhoomidrishti.policy.dto.UpdatePolicyScenarioRequest;
import com.bhoomidrishti.policy.entity.ScenarioStatus;
import com.bhoomidrishti.policy.entity.ScenarioType;
import com.bhoomidrishti.policy.service.PolicyScenarioService;
import com.bhoomidrishti.policy.service.PolicySimulationService;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PolicyScenarioController.class)
@Import(SecurityTestConfiguration.class)
class PolicyScenarioControllerTest {

    private static final String SESSION_COOKIE = "bhoomi_auth";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private PolicyScenarioService scenarioService;

    @MockitoBean
    private PolicySimulationService simulationService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    @DisplayName("1. Create scenario: valid payload by authenticated researcher returns 201 Created")
    void createScenario_valid_returns201() throws Exception {
        UUID projectId = UUID.randomUUID();
        UUID scenarioId = UUID.randomUUID();
        PolicyScenarioResponse response = new PolicyScenarioResponse(
                scenarioId, projectId, UUID.randomUUID(), "Dr. Verma",
                "Indore Urban Corridor", "indore-urban-corridor", "Desc",
                ScenarioType.CORRIDOR_BUFFER_INTERVENTION, ScenarioStatus.DRAFT,
                null, null, 0L, Instant.now(), Instant.now()
        );

        when(scenarioService.createScenario(eq(projectId), any(CreatePolicyScenarioRequest.class), any(Authentication.class)))
                .thenReturn(response);

        String payload = """
                {
                  "name": "Indore Urban Corridor",
                  "slug": "indore-urban-corridor",
                  "description": "Desc",
                  "scenarioType": "CORRIDOR_BUFFER_INTERVENTION"
                }
                """;

        mockMvc.perform(post("/api/projects/{projectId}/scenarios", projectId)
                        .cookie(sessionCookieFor(Role.RESEARCHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(scenarioId.toString()))
                .andExpect(jsonPath("$.name").value("Indore Urban Corridor"))
                .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    @DisplayName("2. Create scenario: unauthenticated returns 401 Unauthorized")
    void createScenario_unauthenticated_returns401() throws Exception {
        UUID projectId = UUID.randomUUID();
        String payload = """
                {
                  "name": "Unauthorized Scenario",
                  "scenarioType": "LAND_USE_CONVERSION"
                }
                """;

        mockMvc.perform(post("/api/projects/{projectId}/scenarios", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("3. Create scenario: invalid payload (missing name and type) returns 400 Bad Request")
    void createScenario_invalidPayload_returns400() throws Exception {
        UUID projectId = UUID.randomUUID();
        String payload = """
                {
                  "description": "Missing required fields"
                }
                """;

        mockMvc.perform(post("/api/projects/{projectId}/scenarios", projectId)
                        .cookie(sessionCookieFor(Role.RESEARCHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").exists())
                .andExpect(jsonPath("$.fieldErrors.scenarioType").exists());
    }

    @Test
    @DisplayName("5 & 7. List project scenarios: public access returns 200 OK")
    void listProjectScenarios_publicProject_returns200() throws Exception {
        UUID projectId = UUID.randomUUID();
        PolicyScenarioResponse item = new PolicyScenarioResponse(
                UUID.randomUUID(), projectId, UUID.randomUUID(), "Creator",
                "Scenario 1", "scenario-1", "Desc",
                ScenarioType.LAND_USE_CONVERSION, ScenarioStatus.COMPLETED,
                null, null, 2L, Instant.now(), Instant.now()
        );
        PageResponse<PolicyScenarioResponse> page = new PageResponse<>(
                List.of(item), 0, 20, 1L, 1, true, true
        );

        when(scenarioService.listScenarios(eq(projectId), any(), nullable(Authentication.class))).thenReturn(page);

        mockMvc.perform(get("/api/projects/{projectId}/scenarios", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Scenario 1"))
                .andExpect(jsonPath("$.content[0].status").value("COMPLETED"));
    }

    @Test
    @DisplayName("6. List project scenarios: unauthorized access on private project returns 404 Not Found")
    void listProjectScenarios_privateProjectUnauthorized_returns404() throws Exception {
        UUID projectId = UUID.randomUUID();
        when(scenarioService.listScenarios(eq(projectId), any(), nullable(Authentication.class)))
                .thenThrow(new ResourceNotFoundException("Project not found: " + projectId));

        mockMvc.perform(get("/api/projects/{projectId}/scenarios", projectId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Project not found: " + projectId));
    }

    @Test
    @DisplayName("8. Get scenario: returns scenario details with 200 OK")
    void getScenario_returnsDetails() throws Exception {
        UUID scenarioId = UUID.randomUUID();
        PolicyScenarioResponse response = new PolicyScenarioResponse(
                scenarioId, UUID.randomUUID(), UUID.randomUUID(), "Creator",
                "Scenario Detail", "scenario-detail", "Desc",
                ScenarioType.LAND_USE_CONVERSION, ScenarioStatus.DRAFT,
                null, null, 0L, Instant.now(), Instant.now()
        );

        when(scenarioService.getScenario(eq(scenarioId), nullable(Authentication.class))).thenReturn(response);

        mockMvc.perform(get("/api/scenarios/{scenarioId}", scenarioId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(scenarioId.toString()))
                .andExpect(jsonPath("$.name").value("Scenario Detail"));
    }

    @Test
    @DisplayName("9. Update draft scenario: returns 200 OK with updated content")
    void updateScenario_draftScenario_returns200() throws Exception {
        UUID scenarioId = UUID.randomUUID();
        PolicyScenarioResponse response = new PolicyScenarioResponse(
                scenarioId, UUID.randomUUID(), UUID.randomUUID(), "Creator",
                "Updated Name", "scenario-detail", "Updated Desc",
                ScenarioType.LAND_USE_CONVERSION, ScenarioStatus.DRAFT,
                null, null, 0L, Instant.now(), Instant.now()
        );

        when(scenarioService.updateScenario(eq(scenarioId), any(UpdatePolicyScenarioRequest.class), any(Authentication.class)))
                .thenReturn(response);

        String payload = """
                {
                  "name": "Updated Name",
                  "description": "Updated Desc"
                }
                """;

        mockMvc.perform(put("/api/scenarios/{scenarioId}", scenarioId)
                        .cookie(sessionCookieFor(Role.RESEARCHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Name"))
                .andExpect(jsonPath("$.description").value("Updated Desc"));
    }

    @Test
    @DisplayName("10. Reject update archived scenario: returns 409 Conflict")
    void updateScenario_archivedScenario_returns409() throws Exception {
        UUID scenarioId = UUID.randomUUID();
        when(scenarioService.updateScenario(eq(scenarioId), any(UpdatePolicyScenarioRequest.class), any(Authentication.class)))
                .thenThrow(new IllegalStateException("Cannot modify an archived scenario"));

        String payload = """
                {
                  "name": "Attempted Edit"
                }
                """;

        mockMvc.perform(put("/api/scenarios/{scenarioId}", scenarioId)
                        .cookie(sessionCookieFor(Role.RESEARCHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Cannot modify an archived scenario"));
    }

    @Test
    @DisplayName("11. Delete draft scenario: returns 204 No Content")
    void deleteScenario_draft_returns204() throws Exception {
        UUID scenarioId = UUID.randomUUID();
        doNothing().when(scenarioService).deleteScenario(eq(scenarioId), any(Authentication.class));

        mockMvc.perform(delete("/api/scenarios/{scenarioId}", scenarioId)
                        .cookie(sessionCookieFor(Role.RESEARCHER)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("12. Reject delete completed scenario: returns 409 Conflict")
    void deleteScenario_completed_returns409() throws Exception {
        UUID scenarioId = UUID.randomUUID();
        doThrow(new IllegalStateException("Cannot delete a scenario with completed simulation results; archive it instead"))
                .when(scenarioService).deleteScenario(eq(scenarioId), any(Authentication.class));

        mockMvc.perform(delete("/api/scenarios/{scenarioId}", scenarioId)
                        .cookie(sessionCookieFor(Role.RESEARCHER)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Cannot delete a scenario with completed simulation results; archive it instead"));
    }

    @Test
    @DisplayName("13. Run scenario: invokes simulation service and returns 200 OK with ScenarioResult")
    void runScenario_authenticated_returns200() throws Exception {
        UUID scenarioId = UUID.randomUUID();
        UUID resultId = UUID.randomUUID();
        ScenarioResultResponse resultResponse = new ScenarioResultResponse(
                resultId, scenarioId, UUID.randomUUID(), "Dr. Verma",
                Instant.now(), 100L, 25L, new BigDecimal("45000.00"),
                new BigDecimal("50000.00"), new BigDecimal("48000.00"),
                1L, new BigDecimal("2000.00"),
                "{}", "{}", "{}"
        );

        when(simulationService.executeScenario(eq(scenarioId), any(Authentication.class))).thenReturn(resultResponse);

        mockMvc.perform(post("/api/scenarios/{scenarioId}/run", scenarioId)
                        .cookie(sessionCookieFor(Role.RESEARCHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(resultId.toString()))
                .andExpect(jsonPath("$.totalParcelsEvaluated").value(100))
                .andExpect(jsonPath("$.totalParcelsAffected").value(25));
    }

    @Test
    @DisplayName("14. Reject unauthorized run: returns 401 Unauthorized when unauthenticated")
    void runScenario_unauthenticated_returns401() throws Exception {
        UUID scenarioId = UUID.randomUUID();

        mockMvc.perform(post("/api/scenarios/{scenarioId}/run", scenarioId))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("15. Get results: returns 200 OK with list of historical snapshots")
    void getScenarioResults_returns200() throws Exception {
        UUID scenarioId = UUID.randomUUID();
        ScenarioResultResponse r1 = new ScenarioResultResponse(
                UUID.randomUUID(), scenarioId, UUID.randomUUID(), "Dr. Verma",
                Instant.now(), 100L, 25L, new BigDecimal("45000.00"),
                null, null, 0L, null, "{}", "{}", "{}"
        );

        when(scenarioService.getScenarioResults(eq(scenarioId), nullable(Authentication.class))).thenReturn(List.of(r1));

        mockMvc.perform(get("/api/scenarios/{scenarioId}/results", scenarioId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].totalParcelsEvaluated").value(100));
    }

    @Test
    @DisplayName("16. Reject unauthorized result access: returns 404 on private project")
    void getScenarioResults_unauthorizedPrivate_returns404() throws Exception {
        UUID scenarioId = UUID.randomUUID();
        when(scenarioService.getScenarioResults(eq(scenarioId), nullable(Authentication.class)))
                .thenThrow(new ResourceNotFoundException("Scenario not found: " + scenarioId));

        mockMvc.perform(get("/api/scenarios/{scenarioId}/results", scenarioId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Scenario not found: " + scenarioId));
    }

    private Cookie sessionCookieFor(Role role) {
        User user = User.registerLocal(
                "Test " + role.name(),
                role.name().toLowerCase() + "@example.com",
                passwordEncoder.encode("secret-pass"));
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        user.changeRole(role);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        return new Cookie(SESSION_COOKIE, jwtService.generateToken(user));
    }
}
