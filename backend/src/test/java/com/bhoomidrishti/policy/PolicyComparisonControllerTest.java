package com.bhoomidrishti.policy;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.auth.security.JwtService;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.policy.controller.PolicyComparisonController;
import com.bhoomidrishti.policy.dto.CompareScenariosRequest;
import com.bhoomidrishti.policy.dto.MetricDeltas;
import com.bhoomidrishti.policy.dto.PairwiseComparison;
import com.bhoomidrishti.policy.dto.ScenarioComparisonItem;
import com.bhoomidrishti.policy.dto.ScenarioComparisonResponse;
import com.bhoomidrishti.policy.dto.ScenarioMetrics;
import com.bhoomidrishti.policy.entity.ScenarioType;
import com.bhoomidrishti.policy.service.PolicyComparisonService;
import com.bhoomidrishti.testconfig.SecurityTestConfiguration;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PolicyComparisonController.class)
@Import(SecurityTestConfiguration.class)
class PolicyComparisonControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private PolicyComparisonService comparisonService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    @DisplayName("Compare endpoint: valid request returns 200 OK with ScenarioComparisonResponse")
    void compareScenarios_valid_returns200() throws Exception {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();

        ScenarioComparisonItem itemA = new ScenarioComparisonItem(
                idA, "Scenario A", ScenarioType.LAND_USE_CONVERSION,
                UUID.randomUUID(), Instant.now(),
                new ScenarioMetrics(100L, 20L, new BigDecimal("50000.00"), null, null, 0L, null),
                Collections.emptyMap(), Collections.emptyMap(), 2L
        );
        ScenarioComparisonItem itemB = new ScenarioComparisonItem(
                idB, "Scenario B", ScenarioType.LAND_USE_CONVERSION,
                UUID.randomUUID(), Instant.now(),
                new ScenarioMetrics(120L, 30L, new BigDecimal("75000.00"), null, null, 0L, null),
                Collections.emptyMap(), Collections.emptyMap(), 1L
        );

        MetricDeltas deltas = new MetricDeltas(
                20L, 10L, new BigDecimal("25000.00"),
                BigDecimal.ZERO, BigDecimal.ZERO, 0L, BigDecimal.ZERO,
                new BigDecimal("5.0000")
        );

        PairwiseComparison pair = new PairwiseComparison(
                idA, "Scenario A", idB, "Scenario B", deltas,
                Collections.emptyList(), Collections.emptyList()
        );

        ScenarioComparisonResponse response = new ScenarioComparisonResponse(
                List.of(itemA, itemB),
                List.of(pair)
        );

        when(comparisonService.compareScenarios(any(CompareScenariosRequest.class), any()))
                .thenReturn(response);

        String payload = """
                {
                  "scenarioIds": ["%s", "%s"]
                }
                """.formatted(idA, idB);

        mockMvc.perform(post("/api/policy/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scenarios").isArray())
                .andExpect(jsonPath("$.scenarios[0].scenarioName").value("Scenario A"))
                .andExpect(jsonPath("$.comparisons[0].metricDeltas.totalParcelsAffected").value(10));
    }

    @Test
    @DisplayName("Compare endpoint: rejected when service throws IllegalArgumentException -> 400 Bad Request")
    void compareScenarios_invalid_returns400() throws Exception {
        when(comparisonService.compareScenarios(any(), any()))
                .thenThrow(new IllegalArgumentException("Scenario comparison requires at least 2 scenarios"));

        String payload = """
                {
                  "scenarioIds": []
                }
                """;

        mockMvc.perform(post("/api/policy/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Scenario comparison requires at least 2 scenarios"));
    }

    @Test
    @DisplayName("Compare endpoint: unauthorized scenario throws ResourceNotFoundException -> 404 Not Found")
    void compareScenarios_unauthorized_returns404() throws Exception {
        when(comparisonService.compareScenarios(any(), any()))
                .thenThrow(new ResourceNotFoundException("Scenario not found"));

        String payload = """
                {
                  "scenarioIds": ["%s", "%s"]
                }
                """.formatted(UUID.randomUUID(), UUID.randomUUID());

        mockMvc.perform(post("/api/policy/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Scenario not found"));
    }

    @Test
    @DisplayName("Compare endpoint: scenario without results throws IllegalStateException -> 409 Conflict")
    void compareScenarios_incomplete_returns409() throws Exception {
        when(comparisonService.compareScenarios(any(), any()))
                .thenThrow(new IllegalStateException("Scenario has no completed simulation results"));

        String payload = """
                {
                  "scenarioIds": ["%s", "%s"]
                }
                """.formatted(UUID.randomUUID(), UUID.randomUUID());

        mockMvc.perform(post("/api/policy/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Scenario has no completed simulation results"));
    }
}
