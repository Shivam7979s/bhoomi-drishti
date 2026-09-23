package com.bhoomidrishti.policy.dto;

import com.bhoomidrishti.policy.entity.ScenarioType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreatePolicyScenarioRequest(
        @NotBlank(message = "Scenario name is required")
        @Size(max = 200, message = "Scenario name cannot exceed 200 characters")
        String name,

        @Size(max = 220, message = "Slug cannot exceed 220 characters")
        String slug,

        @Size(max = 10000, message = "Description cannot exceed 10000 characters")
        String description,

        @NotNull(message = "Scenario type is required")
        ScenarioType scenarioType,

        @Valid
        ScenarioParameterRequest parameters
) {
}
