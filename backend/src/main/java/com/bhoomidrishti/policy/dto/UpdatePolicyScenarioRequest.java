package com.bhoomidrishti.policy.dto;

import com.bhoomidrishti.policy.entity.ScenarioStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

public record UpdatePolicyScenarioRequest(
        @Size(max = 200, message = "Scenario name cannot exceed 200 characters")
        String name,

        @Size(max = 10000, message = "Description cannot exceed 10000 characters")
        String description,

        ScenarioStatus status,

        @Valid
        ScenarioParameterRequest parameters
) {
}
