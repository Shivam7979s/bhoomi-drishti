package com.bhoomidrishti.policy.dto;

import java.math.BigDecimal;

/**
 * Normalized numerical impact metrics for a simulated scenario result.
 */
public record ScenarioMetrics(
        Long totalParcelsEvaluated,
        Long totalParcelsAffected,
        BigDecimal totalAreaAffectedSqm,
        BigDecimal baselineAreaSqm,
        BigDecimal simulatedAreaSqm,
        Long disputedParcelsCount,
        BigDecimal disputedAreaSqm
) {
}
