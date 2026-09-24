package com.bhoomidrishti.governance.dto;

import java.math.BigDecimal;

/**
 * Key-level categorical and distribution variance between two snapshot breakdowns.
 */
public record BreakdownVarianceItemDTO(
        String key,
        BigDecimal baselineValue,
        BigDecimal targetValue,
        BigDecimal delta,
        BigDecimal percentageChange,
        boolean percentageChangeDefined,
        String baselineRawValue,
        String targetRawValue
) {}
