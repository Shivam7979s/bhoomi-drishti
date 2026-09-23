package com.bhoomidrishti.policy.controller;

import com.bhoomidrishti.common.PageResponse;
import com.bhoomidrishti.policy.dto.CreatePolicyScenarioRequest;
import com.bhoomidrishti.policy.dto.PolicyScenarioResponse;
import com.bhoomidrishti.policy.dto.ScenarioResultResponse;
import com.bhoomidrishti.policy.dto.UpdatePolicyScenarioRequest;
import com.bhoomidrishti.policy.service.PolicyScenarioService;
import com.bhoomidrishti.policy.service.PolicySimulationService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API for policy scenario lifecycle management, execution, and result retrieval.
 */
@RestController
@Validated
public class PolicyScenarioController {

    private final PolicyScenarioService scenarioService;
    private final PolicySimulationService simulationService;

    public PolicyScenarioController(
            PolicyScenarioService scenarioService,
            PolicySimulationService simulationService) {
        this.scenarioService = scenarioService;
        this.simulationService = simulationService;
    }

    /**
     * Lists scenarios belonging to a project.
     * Public projects are readable anonymously; private projects require membership.
     */
    @GetMapping("/api/projects/{projectId}/scenarios")
    public ResponseEntity<PageResponse<PolicyScenarioResponse>> listProjectScenarios(
            @PathVariable UUID projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        PageResponse<PolicyScenarioResponse> response = scenarioService.listScenarios(
                projectId, PageRequest.of(page, size), auth);
        return ResponseEntity.ok(response);
    }

    /**
     * Creates a new scenario under a project.
     * Requires contributor or lead permissions on the project.
     */
    @PostMapping("/api/projects/{projectId}/scenarios")
    public ResponseEntity<PolicyScenarioResponse> createScenario(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreatePolicyScenarioRequest request,
            Authentication auth) {
        PolicyScenarioResponse response = scenarioService.createScenario(projectId, request, auth);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieves detailed metadata and latest result summary for a scenario.
     */
    @GetMapping("/api/scenarios/{scenarioId}")
    public ResponseEntity<PolicyScenarioResponse> getScenario(
            @PathVariable UUID scenarioId,
            Authentication auth) {
        PolicyScenarioResponse response = scenarioService.getScenario(scenarioId, auth);
        return ResponseEntity.ok(response);
    }

    /**
     * Updates an existing scenario's metadata or parameters.
     * Modifying parameters on a COMPLETED scenario resets it to DRAFT.
     * Modifying an ARCHIVED or RUNNING scenario is rejected.
     */
    @PutMapping("/api/scenarios/{scenarioId}")
    public ResponseEntity<PolicyScenarioResponse> updateScenario(
            @PathVariable UUID scenarioId,
            @Valid @RequestBody UpdatePolicyScenarioRequest request,
            Authentication auth) {
        PolicyScenarioResponse response = scenarioService.updateScenario(scenarioId, request, auth);
        return ResponseEntity.ok(response);
    }

    /**
     * Deletes a scenario.
     * Only DRAFT scenarios can be deleted. COMPLETED or ARCHIVED scenarios cannot be deleted.
     */
    @DeleteMapping("/api/scenarios/{scenarioId}")
    public ResponseEntity<Void> deleteScenario(
            @PathVariable UUID scenarioId,
            Authentication auth) {
        scenarioService.deleteScenario(scenarioId, auth);
        return ResponseEntity.noContent().build();
    }

    /**
     * Executes the PostGIS simulation for a scenario (Phase 8B).
     */
    @PostMapping("/api/scenarios/{scenarioId}/run")
    public ResponseEntity<ScenarioResultResponse> runScenario(
            @PathVariable UUID scenarioId,
            Authentication auth) {
        ScenarioResultResponse response = simulationService.executeScenario(scenarioId, auth);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves historical simulation results for a scenario.
     */
    @GetMapping("/api/scenarios/{scenarioId}/results")
    public ResponseEntity<List<ScenarioResultResponse>> getScenarioResults(
            @PathVariable UUID scenarioId,
            Authentication auth) {
        List<ScenarioResultResponse> results = scenarioService.getScenarioResults(scenarioId, auth);
        return ResponseEntity.ok(results);
    }
}
