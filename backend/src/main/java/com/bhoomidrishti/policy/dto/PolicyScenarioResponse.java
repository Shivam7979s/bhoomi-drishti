package com.bhoomidrishti.policy.dto;

import com.bhoomidrishti.policy.entity.PolicyScenario;
import com.bhoomidrishti.policy.entity.ScenarioStatus;
import com.bhoomidrishti.policy.entity.ScenarioType;
import java.time.Instant;
import java.util.UUID;

public record PolicyScenarioResponse(
        UUID id,
        UUID projectId,
        UUID createdById,
        String createdByName,
        String name,
        String slug,
        String description,
        ScenarioType scenarioType,
        ScenarioStatus status,
        ScenarioParameterResponse parameters,
        ScenarioResultResponse latestResult,
        long evidenceCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static PolicyScenarioResponse from(
            PolicyScenario s,
            ScenarioParameterResponse params,
            ScenarioResultResponse latestResult,
            long evidenceCount) {
        if (s == null) return null;
        UUID projId = s.getProject() != null ? s.getProject().getId() : null;
        UUID userId = s.getCreatedBy() != null ? s.getCreatedBy().getId() : null;
        String userName = s.getCreatedBy() != null ? s.getCreatedBy().getName() : null;

        return new PolicyScenarioResponse(
                s.getId(),
                projId,
                userId,
                userName,
                s.getName(),
                s.getSlug(),
                s.getDescription(),
                s.getScenarioType(),
                s.getStatus(),
                params,
                latestResult,
                evidenceCount,
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}
