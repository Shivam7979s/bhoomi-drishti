package com.bhoomidrishti.policy.dto;

import com.bhoomidrishti.policy.entity.ScenarioResult;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ScenarioResultResponse(
        UUID id,
        UUID scenarioId,
        UUID executedById,
        String executedByName,
        Instant executedAt,
        Long totalParcelsEvaluated,
        Long totalParcelsAffected,
        BigDecimal totalAreaAffectedSqm,
        BigDecimal baselineAreaSqm,
        BigDecimal simulatedAreaSqm,
        Long disputedParcelsCount,
        BigDecimal disputedAreaSqm,
        String landUseDistributionJson,
        String ownershipDistributionJson,
        String spatialSummaryJson
) {
    public static ScenarioResultResponse from(ScenarioResult r) {
        if (r == null) return null;
        UUID execId = r.getExecutedBy() != null ? r.getExecutedBy().getId() : null;
        String execName = r.getExecutedBy() != null ? r.getExecutedBy().getName() : null;
        return new ScenarioResultResponse(
                r.getId(),
                r.getScenario() != null ? r.getScenario().getId() : null,
                execId,
                execName,
                r.getExecutedAt(),
                r.getTotalParcelsEvaluated(),
                r.getTotalParcelsAffected(),
                r.getTotalAreaAffectedSqm(),
                r.getBaselineAreaSqm(),
                r.getSimulatedAreaSqm(),
                r.getDisputedParcelsCount(),
                r.getDisputedAreaSqm(),
                r.getLandUseDistributionJson(),
                r.getOwnershipDistributionJson(),
                r.getSpatialSummaryJson()
        );
    }
}
