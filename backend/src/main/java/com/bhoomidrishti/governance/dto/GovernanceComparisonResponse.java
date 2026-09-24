package com.bhoomidrishti.governance.dto;

import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import com.bhoomidrishti.governance.entity.IndicatorCategory;
import com.bhoomidrishti.governance.entity.IndicatorUnit;
import java.util.List;
import java.util.UUID;

/**
 * Complete deterministic response payload for a temporal governance comparison.
 */
public record GovernanceComparisonResponse(
        String indicatorCode,
        String indicatorName,
        IndicatorCategory category,
        IndicatorUnit unit,
        GovernanceScopeType scopeType,
        String state,
        String district,
        String tehsil,
        String village,
        UUID projectId,

        GovernanceMilestoneDTO baseline,
        GovernanceMilestoneDTO target,

        GovernanceMetricDeltaDTO quantitativeVariance,
        List<BreakdownVarianceItemDTO> breakdownVariances,
        GovernanceEvidenceDeltaDTO evidenceDelta,

        boolean calculationVersionMismatch,
        Long elapsedDays,
        boolean chronologicalReversal
) {}
