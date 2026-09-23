package com.bhoomidrishti.policy.dto;

import java.util.List;
import java.util.UUID;

/**
 * Pairwise side-by-side descriptive comparison between two scenario results.
 * Strictly non-judgmental and descriptive (delta = right - left).
 */
public record PairwiseComparison(
        UUID leftScenarioId,
        String leftScenarioName,
        UUID rightScenarioId,
        String rightScenarioName,
        MetricDeltas metricDeltas,
        List<DistributionDelta> landUseDistributionDeltas,
        List<DistributionDelta> ownershipDistributionDeltas
) {
}
