package com.bhoomidrishti.policy.dto;

import java.math.BigDecimal;

/**
 * Deterministic category-wise delta between two distributions (right minus left).
 * Missing categories in either scenario are treated as zero.
 */
public record DistributionDelta(
        String category,
        long leftParcelCount,
        long rightParcelCount,
        long parcelCountDelta,
        BigDecimal leftAreaSqm,
        BigDecimal rightAreaSqm,
        BigDecimal areaSqmDelta,
        BigDecimal leftAreaPercentage,
        BigDecimal rightAreaPercentage,
        BigDecimal areaPercentagePointDelta
) {
}
