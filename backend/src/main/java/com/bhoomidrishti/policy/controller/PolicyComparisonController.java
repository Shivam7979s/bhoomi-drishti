package com.bhoomidrishti.policy.controller;

import com.bhoomidrishti.policy.dto.CompareScenariosRequest;
import com.bhoomidrishti.policy.dto.ScenarioComparisonResponse;
import com.bhoomidrishti.policy.service.PolicyComparisonService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API for deterministic, side-by-side scenario result comparison.
 */
@RestController
@RequestMapping("/api/policy/compare")
@Validated
public class PolicyComparisonController {

    private final PolicyComparisonService comparisonService;

    public PolicyComparisonController(PolicyComparisonService comparisonService) {
        this.comparisonService = comparisonService;
    }

    /**
     * Compares 2 to 10 completed policy scenario result snapshots.
     * Purely descriptive; no rankings, scores, or recommendations.
     */
    @PostMapping
    public ResponseEntity<ScenarioComparisonResponse> compareScenarios(
            @Valid @RequestBody CompareScenariosRequest request,
            Authentication auth) {
        ScenarioComparisonResponse response = comparisonService.compareScenarios(request, auth);
        return ResponseEntity.ok(response);
    }
}
