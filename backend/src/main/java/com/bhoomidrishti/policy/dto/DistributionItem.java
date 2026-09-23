package com.bhoomidrishti.policy.dto;

import java.math.BigDecimal;

/**
 * Breakdown stats for a single distribution category (land use or ownership).
 */
public record DistributionItem(
        long parcelCount,
        BigDecimal areaSqMeters,
        BigDecimal areaPercentage
) {
}
