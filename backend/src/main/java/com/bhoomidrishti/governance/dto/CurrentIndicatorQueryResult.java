package com.bhoomidrishti.governance.dto;

import com.bhoomidrishti.governance.entity.AggregationMethod;
import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import com.bhoomidrishti.governance.entity.IndicatorCategory;
import com.bhoomidrishti.governance.entity.IndicatorUnit;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Result DTO representing a deterministic, real-time query calculation
 * over current spatial land records or project land records.
 *
 * <p>Distinct from historical persisted {@link com.bhoomidrishti.governance.entity.GovernanceIndicatorSnapshot}.
 */
public record CurrentIndicatorQueryResult(
        String indicatorCode,
        String indicatorName,
        IndicatorCategory category,
        IndicatorUnit unit,
        AggregationMethod aggregationMethod,
        GovernanceScopeType scopeType,
        String state,
        String district,
        String tehsil,
        String village,
        UUID projectId,
        BigDecimal numericValue,
        BigDecimal denominator,
        String breakdownJson,
        String calculationVersion,
        Instant sourceDataTimestamp
) {}
