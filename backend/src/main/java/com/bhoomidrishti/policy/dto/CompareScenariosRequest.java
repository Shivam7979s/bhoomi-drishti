package com.bhoomidrishti.policy.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Request payload for comparing policy scenario results.
 * Supports explicit result targeting (scenarioResults) or simple scenario ID lists (scenarioIds).
 */
public record CompareScenariosRequest(
        @Size(max = 10, message = "Cannot compare more than 10 scenarios")
        List<@Valid ScenarioResultTarget> scenarioResults,

        @Size(max = 10, message = "Cannot compare more than 10 scenarios")
        List<UUID> scenarioIds
) {
    public List<ScenarioResultTarget> getEffectiveTargets() {
        if (scenarioResults != null && !scenarioResults.isEmpty()) {
            return scenarioResults;
        }
        if (scenarioIds != null && !scenarioIds.isEmpty()) {
            return scenarioIds.stream()
                    .map(id -> new ScenarioResultTarget(id, null))
                    .toList();
        }
        return Collections.emptyList();
    }
}
