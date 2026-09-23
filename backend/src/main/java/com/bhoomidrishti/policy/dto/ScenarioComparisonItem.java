package com.bhoomidrishti.policy.dto;

import com.bhoomidrishti.policy.entity.ScenarioType;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Descriptive evaluation snapshot of an individual scenario in a comparison set.
 * Contains no ranking, score, or subjective evaluation.
 */
public record ScenarioComparisonItem(
        UUID scenarioId,
        String scenarioName,
        ScenarioType scenarioType,
        UUID resultId,
        Instant executedAt,
        ScenarioMetrics metrics,
        Map<String, DistributionItem> landUseDistribution,
        Map<String, DistributionItem> ownershipDistribution,
        long evidenceCount
) {
}
