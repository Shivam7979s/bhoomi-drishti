package com.bhoomidrishti.policy.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * Target scenario and optional specific result snapshot for comparison.
 * If resultId is null, the latest completed result is used.
 */
public record ScenarioResultTarget(
        @NotNull(message = "Scenario ID is required")
        UUID scenarioId,
        UUID resultId
) {
}
