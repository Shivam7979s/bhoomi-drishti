package com.bhoomidrishti.governance.dto;

import java.math.BigDecimal;

/**
 * Deterministic quantitative variance between two governance measurement milestones.
 */
public record GovernanceMetricDeltaDTO(
        BigDecimal absoluteDelta,
        BigDecimal percentageChange,
        boolean percentageChangeDefined,
        String trendDirection,
        BigDecimal denominatorDelta
) {}
