package com.bhoomidrishti.policy.dto;

import java.math.BigDecimal;

/**
 * Deterministic mathematical deltas between two scenarios (right minus left).
 * Strictly descriptive.
 */
public record MetricDeltas(
        Long totalParcelsEvaluated,
        Long totalParcelsAffected,
        BigDecimal totalAreaAffectedSqm,
        BigDecimal baselineAreaSqm,
        BigDecimal simulatedAreaSqm,
        Long disputedParcelsCount,
        BigDecimal disputedAreaSqm,
        BigDecimal affectedParcelsPercentagePointDelta
) {
}
