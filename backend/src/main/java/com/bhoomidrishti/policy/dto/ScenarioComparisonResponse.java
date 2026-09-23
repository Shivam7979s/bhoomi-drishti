package com.bhoomidrishti.policy.dto;

import java.util.List;

/**
 * Top-level response for policy scenario comparison.
 * Contains descriptive scenario snapshots and neutral pairwise comparison matrices.
 * Does not contain rankings, scores, winners, or recommendations.
 */
public record ScenarioComparisonResponse(
        List<ScenarioComparisonItem> scenarios,
        List<PairwiseComparison> comparisons
) {
}
