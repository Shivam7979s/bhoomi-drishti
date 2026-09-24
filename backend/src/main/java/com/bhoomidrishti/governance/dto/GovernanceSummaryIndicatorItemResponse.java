package com.bhoomidrishti.governance.dto;

import com.bhoomidrishti.governance.entity.AggregationMethod;
import com.bhoomidrishti.governance.entity.IndicatorCategory;
import com.bhoomidrishti.governance.entity.IndicatorUnit;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Result item for a single evaluated governance indicator in an administrative summary.
 *
 * <p>Strictly live-only: does not include snapshotId, asOf, or evidenceCount.
 */
public record GovernanceSummaryIndicatorItemResponse(
        String indicatorCode,
        String indicatorName,
        IndicatorCategory category,
        IndicatorUnit unit,
        AggregationMethod aggregationMethod,
        BigDecimal numericValue,
        BigDecimal denominator,
        String breakdownJson,
        Instant sourceDataTimestamp
) {}
